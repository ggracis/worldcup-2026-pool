// v2
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onValueWritten, onValueCreated } from 'firebase-functions/v2/database';
import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.database();

// FIFA API constants for World Cup 2026
const FIFA_COMPETITION_ID = '17'; // FIFA World Cup
const FIFA_SEASON_ID = '285023'; // 2026

interface Match {
  game: number;
  fifaId: string;
  homeScore: number;
  awayScore: number;
  home: string;
  homeName: string;
  away: string;
  awayName: string;
}

interface MatchFull extends Match {
  timestamp: number;
  homeName: string;
  awayName: string;
  round: string;
}

interface UserData {
  email: string;
  displayName: string;
}

interface Prediction {
  homePrediction: number;
  awayPrediction: number;
  points: number;
}

interface FifaMatch {
  IdMatch: string;
  Home: { Score: number | null; Abbreviation: string | null; ShortClubName: string | null };
  Away: { Score: number | null; Abbreviation: string | null; ShortClubName: string | null };
}

interface FifaApiResponse {
  Results: FifaMatch[];
}

/**
 * Determine the winner of a match
 */
const getWinner = (home: number, away: number): 'home' | 'away' | 'tied' => {
  if (home > away) return 'home';
  if (home < away) return 'away';
  return 'tied';
};

/**
 * Calculate points for a prediction
 * - 15 points: Exact score
 * - Up to 10 points: Correct winner, minus difference from actual score (min 0)
 * - 0 points: Wrong winner or no prediction
 */
const calculatePoints = (
  homeScore: number,
  awayScore: number,
  homePrediction: number | null,
  awayPrediction: number | null
): number => {
  // No prediction or match not played yet
  if (homeScore < 0 || homePrediction === null || awayPrediction === null) {
    return 0;
  }

  // Exact score: 15 points
  if (homeScore === homePrediction && awayScore === awayPrediction) {
    return 15;
  }

  // Correct winner: 10 points minus difference (min 0)
  if (getWinner(homeScore, awayScore) === getWinner(homePrediction, awayPrediction)) {
    const difference = Math.abs(homePrediction - homeScore) + Math.abs(awayPrediction - awayScore);
    return Math.max(0, 10 - difference);
  }

  // Wrong winner: 0 points
  return 0;
};

/**
 * Scheduled function to fetch and update match scores from FIFA API
 * Runs every 1 minute during the tournament
 */
export const updateMatchScores = onSchedule('every 1 minutes', async () => {
  logger.info('Updating match scores from FIFA API...');

  try {
    // Fetch ALL tournament matches from FIFA API (no date filter).
    // With only ~104 matches the payload is tiny (~225 KB), and filtering by
    // day broke late games: a kickoff >= 22:00 UTC has its second half and
    // final score land after midnight UTC, by which time the daily window has
    // rolled over to the next day and no longer includes the match. Matching by
    // fifaId makes the date filter unnecessary anyway.
    const apiUrl = `https://api.fifa.com/api/v3/calendar/matches?idseason=${FIFA_SEASON_ID}&idcompetition=${FIFA_COMPETITION_ID}&count=500`;

    const response = await fetch(apiUrl);
    // FIFA API returns errors as plain text, sometimes with status 200
    const body = await response.text();
    if (!response.ok || !body.startsWith('{')) {
      throw new Error(`FIFA API error ${response.status}: ${body.slice(0, 200)}`);
    }

    const data = JSON.parse(body) as FifaApiResponse;

    // Get current matches from database
    const matchesSnapshot = await db.ref('matches').once('value');
    const matches = matchesSnapshot.val() as Record<string, Match> | null;

    if (!matches) {
      logger.warn('No matches found in database');
      return;
    }

    // Update scores (and knockout team names) for matching games
    const updates: Record<string, number | string> = {};

    for (const fifaMatch of data.Results) {
      for (const [gameId, match] of Object.entries(matches)) {
        if (match.fifaId === fifaMatch.IdMatch) {
          const homeScore = fifaMatch.Home?.Score ?? -1;
          const awayScore = fifaMatch.Away?.Score ?? -1;

          if (match.homeScore !== homeScore && homeScore >= 0) {
            updates[`matches/${gameId}/homeScore`] = homeScore;
            logger.info(`Updated game ${gameId} home score: ${homeScore}`);
          }

          if (match.awayScore !== awayScore && awayScore >= 0) {
            updates[`matches/${gameId}/awayScore`] = awayScore;
            logger.info(`Updated game ${gameId} away score: ${awayScore}`);
          }

          // Knockout: fill in the real teams once FIFA defines the bracket.
          // Abbreviation/ShortClubName are null while the slot is still a
          // placeholder (e.g. "2A"), so we only write once they resolve.
          const homeAbbr = fifaMatch.Home?.Abbreviation;
          const homeName = fifaMatch.Home?.ShortClubName;
          const awayAbbr = fifaMatch.Away?.Abbreviation;
          const awayName = fifaMatch.Away?.ShortClubName;

          if (homeAbbr && match.home !== homeAbbr) {
            updates[`matches/${gameId}/home`] = homeAbbr;
            logger.info(`Updated game ${gameId} home team: ${homeAbbr}`);
          }
          if (homeName && match.homeName !== homeName) {
            updates[`matches/${gameId}/homeName`] = homeName;
          }
          if (awayAbbr && match.away !== awayAbbr) {
            updates[`matches/${gameId}/away`] = awayAbbr;
            logger.info(`Updated game ${gameId} away team: ${awayAbbr}`);
          }
          if (awayName && match.awayName !== awayName) {
            updates[`matches/${gameId}/awayName`] = awayName;
          }
        }
      }
    }

    // Apply all updates at once
    if (Object.keys(updates).length > 0) {
      await db.ref().update(updates);
      logger.info(`Applied ${Object.keys(updates).length} score updates`);
    }
  } catch (error) {
    logger.error('Error updating match scores:', error);
  }
});

/**
 * Triggered when a match is updated
 * Recalculates prediction points for all users for that match
 */
export const updatePredictionPoints = onValueWritten(
  'matches/{matchId}',
  async (event) => {
    const matchId = event.params.matchId;
    const match = event.data.after.val() as Match | null;

    if (!match) {
      logger.warn(`Match ${matchId} was deleted`);
      return;
    }

    // Only recalculate if match has scores
    if (match.homeScore < 0 || match.awayScore < 0) {
      return;
    }

    logger.info(`Updating prediction points for match ${matchId}`);

    try {
      // Get all users
      const usersSnapshot = await db.ref('users').once('value');
      const users = usersSnapshot.val() as Record<string, unknown> | null;

      if (!users) {
        return;
      }

      const updates: Record<string, number> = {};

      // Calculate points for each user's prediction
      for (const userId of Object.keys(users)) {
        const predictionSnapshot = await db.ref(`predictions/${userId}/${matchId}`).once('value');
        const prediction = predictionSnapshot.val() as Prediction | null;

        if (prediction) {
          const points = calculatePoints(
            match.homeScore,
            match.awayScore,
            prediction.homePrediction,
            prediction.awayPrediction
          );

          if (prediction.points !== points) {
            updates[`predictions/${userId}/${matchId}/points`] = points;
            logger.info(`User ${userId}: ${points} points for match ${matchId}`);
          }
        }
      }

      // Apply all updates at once
      if (Object.keys(updates).length > 0) {
        await db.ref().update(updates);
        logger.info(`Updated ${Object.keys(updates).length} prediction points`);
      }
    } catch (error) {
      logger.error('Error updating prediction points:', error);
    }
  }
);

/**
 * Triggered when prediction points change
 * Updates the user's total score
 */
export const updateUserScore = onValueWritten(
  'predictions/{userId}/{matchId}/points',
  async (event) => {
    const { userId } = event.params;
    const beforePoints = event.data.before.val() as number | null ?? 0;
    const afterPoints = event.data.after.val() as number | null ?? 0;

    // No change in points
    if (beforePoints === afterPoints) {
      return;
    }

    const pointsDiff = afterPoints - beforePoints;

    logger.info(`User ${userId} points changed: ${beforePoints} -> ${afterPoints} (diff: ${pointsDiff})`);

    try {
      const scoreSnapshot = await db.ref(`users/${userId}/score`).once('value');
      const currentScore = scoreSnapshot.val() as number | null ?? 0;
      const newScore = currentScore + pointsDiff;

      await db.ref(`users/${userId}/score`).set(newScore);
      logger.info(`User ${userId} total score: ${newScore}`);
    } catch (error) {
      logger.error('Error updating user score:', error);
    }
  }
);

// ─── Email helpers ────────────────────────────────────────────────────────────

const SITE_URL = process.env.SITE_URL ?? 'https://prode.gastongracis.dev';
const APP_NAME = process.env.APP_NAME ?? 'Mundial de Fútbol 26';

const ROUND_NAMES_ES: Record<string, string> = {
  'Round of 32': 'Dieciseisavos de final',
  'Round of 16': 'Octavos de final',
  'Quarter-Final': 'Cuartos de final',
  'Quarter Final': 'Cuartos de final',
  'Semi-Final': 'Semifinales',
  'Semi Final': 'Semifinales',
  'Third Place': 'Tercer puesto',
  'Third-Place': 'Tercer puesto',
  'Final': 'Final',
};

const translateRound = (round: string): string =>
  ROUND_NAMES_ES[round] ?? round;

interface EmailOptions {
  icon: string;
  title: string;
  subtitle: string;
  body: string;
  matchRows?: string;
  footerNote?: string;
}

const buildMatchRow = (
  homeName: string,
  awayName: string,
  kickoff: string,
  deadline: string
): string =>
  `<tr>
    <td style="padding:12px 16px;border-bottom:1px solid #1f2937;color:#e5e7eb;font-weight:500;">${homeName} vs ${awayName}</td>
    <td style="padding:12px 16px;border-bottom:1px solid #1f2937;color:#d1d5db;white-space:nowrap;font-size:13px;">${kickoff}</td>
    <td style="padding:12px 16px;border-bottom:1px solid #1f2937;color:#f59e0b;white-space:nowrap;font-size:13px;font-weight:600;">${deadline}</td>
  </tr>`;

const buildEmailHtml = (opts: EmailOptions): string => `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#111827;border-radius:16px;overflow:hidden;border:1px solid #1f2937;">

      <!-- Header -->
      <tr>
        <td style="background:linear-gradient(135deg,#064e3b 0%,#065f46 50%,#047857 100%);padding:32px 24px;text-align:center;">
          <div style="font-size:44px;line-height:1;margin-bottom:12px;">${opts.icon}</div>
          <h1 style="margin:0;font-size:26px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">${opts.title}</h1>
          <p style="margin:8px 0 0;color:#a7f3d0;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;">${opts.subtitle}</p>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:28px 24px;">
          ${opts.body}
          ${opts.matchRows !== undefined ? `
          <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;border-collapse:collapse;border:1px solid #1f2937;border-radius:8px;overflow:hidden;margin-top:20px;">
            <thead>
              <tr style="background:#1f2937;">
                <th style="padding:10px 16px;text-align:left;color:#9ca3af;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Partido</th>
                <th style="padding:10px 16px;text-align:left;color:#9ca3af;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;white-space:nowrap;">Arranque</th>
                <th style="padding:10px 16px;text-align:left;color:#f59e0b;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;white-space:nowrap;">⏰ Cierre</th>
              </tr>
            </thead>
            <tbody>${opts.matchRows || '<tr><td colspan="3" style="padding:20px;color:#6b7280;text-align:center;">No hay partidos próximos</td></tr>'}</tbody>
          </table>` : ''}

          <!-- CTA -->
          <div style="text-align:center;margin:28px 0 0;">
            <a href="${SITE_URL}" style="display:inline-block;background:linear-gradient(135deg,#065f46,#047857);color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:8px;letter-spacing:0.3px;">
              ⚽ Ir al prode
            </a>
          </div>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding:16px 24px;background:#0d1117;border-top:1px solid #1f2937;text-align:center;">
          <p style="margin:0;font-size:12px;color:#4b5563;">
            ${opts.footerNote ?? `${APP_NAME} · Este email se envió porque sos parte de la competencia.`}
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;

const fmtArgTime = (timestampSec: number) =>
  new Date(timestampSec * 1000).toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

interface ResendEmail {
  from: string;
  to: string[];
  subject: string;
  html: string;
}

const sendBatch = async (
  emails: ResendEmail[],
  apiKey: string
): Promise<void> => {
  const BATCH_SIZE = 100;
  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const batch = emails.slice(i, i + BATCH_SIZE);
    const res = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batch),
    });
    if (!res.ok) {
      const txt = await res.text();
      logger.error(`Resend batch ${i}–${i + batch.length} failed: ${txt}`);
    } else {
      logger.info(`Sent ${batch.length} emails (offset ${i})`);
    }
  }
};

// ─── Weekly reminder ──────────────────────────────────────────────────────────

/**
 * Runs every Monday at 12:00 UTC (9:00 AM Argentina).
 * For each user, finds upcoming matches (deadline within 7 days) where
 * they haven't submitted a prediction yet, and sends a personalized email.
 * Users who have predicted everything don't get an email.
 */
export const sendWeeklyReminders = onSchedule('0 12 * * 1', async () => {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'noreply@example.com';
  const fromName = process.env.RESEND_FROM_NAME ?? 'FIFA WC 2026 Pool';

  if (!resendApiKey) {
    logger.error('RESEND_API_KEY not configured');
    return;
  }

  const now = Date.now();
  const windowEnd = now + 7 * 24 * 60 * 60 * 1000;

  // Load matches and all predictions in parallel
  const [matchesSnap, usersSnap, predictionsSnap] = await Promise.all([
    db.ref('matches').once('value'),
    db.ref('users').once('value'),
    db.ref('predictions').once('value'),
  ]);

  const allMatches = matchesSnap.val() as Record<string, MatchFull> | null;
  const users = usersSnap.val() as Record<string, UserData> | null;
  const allPredictions = predictionsSnap.val() as Record<
    string,
    Record<string, { homePrediction: number | null; awayPrediction: number | null }>
  > | null;

  if (!allMatches || !users) return;

  // Matches with deadline in the next 7 days, sorted by kickoff
  const upcomingEntries = Object.entries(allMatches)
    .filter(([, m]) => {
      const dl = m.timestamp * 1000 - 10 * 60 * 1000;
      return dl > now && dl <= windowEnd;
    })
    .sort(([, a], [, b]) => a.timestamp - b.timestamp);

  if (upcomingEntries.length === 0) {
    logger.info('No upcoming matches this week');
    return;
  }

  const emails: ResendEmail[] = [];

  for (const [userId, userData] of Object.entries(users)) {
    if (!userData.email) continue;

    const userPreds = allPredictions?.[userId] ?? {};

    // Find which of the upcoming matches this user hasn't predicted yet
    const missing = upcomingEntries.filter(([matchId]) => {
      const p = userPreds[matchId];
      return (
        !p ||
        p.homePrediction === null ||
        p.homePrediction === undefined ||
        p.awayPrediction === null ||
        p.awayPrediction === undefined
      );
    });

    if (missing.length === 0) continue; // nothing to remind

    const matchRows = missing
      .map(([, m]) =>
        buildMatchRow(m.homeName, m.awayName, fmtArgTime(m.timestamp), fmtArgTime(m.timestamp - 10 * 60))
      )
      .join('');

    const name = userData.displayName || userData.email.split('@')[0];
    const pendingCount = missing.length;
    const subject = `⚽ Tenés ${pendingCount} predicción${pendingCount > 1 ? 'es' : ''} pendiente${pendingCount > 1 ? 's' : ''}`;

    const html = buildEmailHtml({
      icon: '⚽',
      title: APP_NAME,
      subtitle: 'Recordatorio semanal',
      body: `<p style="margin:0 0 8px;font-size:16px;color:#f3f4f6;">
        Hola <strong style="color:#fff;">${name}</strong>, te quedan
        <strong style="color:#34d399;">${pendingCount} predicción${pendingCount > 1 ? 'es' : ''}</strong>
        pendiente${pendingCount > 1 ? 's' : ''} esta semana. No te quedes afuera 👇
      </p>
      <p style="margin:0;font-size:13px;color:#9ca3af;">
        Las predicciones cierran <strong style="color:#f59e0b;">10 minutos antes</strong> de cada partido.
      </p>`,
      matchRows,
    });

    emails.push({
      from: `${fromName} <${fromEmail}>`,
      to: [userData.email],
      subject,
      html,
    });
  }

  if (emails.length === 0) {
    logger.info('All users are up to date — no reminders needed');
    return;
  }

  logger.info(`Sending weekly reminders to ${emails.length} users`);
  await sendBatch(emails, resendApiKey);
});

// ─── Phase start notification ─────────────────────────────────────────────────

/**
 * Runs daily at 14:00 UTC (11:00 AM Argentina).
 * Detects when a new knockout phase starts within the next 36 hours.
 * Sends a notification to ALL users (once per phase, tracked in DB).
 */
export const sendPhaseStartReminders = onSchedule('0 14 * * *', async () => {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'noreply@example.com';
  const fromName = process.env.RESEND_FROM_NAME ?? 'FIFA WC 2026 Pool';

  if (!resendApiKey) {
    logger.error('RESEND_API_KEY not configured');
    return;
  }

  const now = Date.now();
  const lookahead = now + 36 * 60 * 60 * 1000;

  const [matchesSnap, notifiedSnap, usersSnap] = await Promise.all([
    db.ref('matches').once('value'),
    db.ref('notifications/phasesNotified').once('value'),
    db.ref('users').once('value'),
  ]);

  const allMatches = matchesSnap.val() as Record<string, MatchFull> | null;
  const notified = (notifiedSnap.val() as Record<string, boolean> | null) ?? {};
  const users = usersSnap.val() as Record<string, UserData> | null;

  if (!allMatches || !users) return;

  // Group matches by round, keeping only non-group-stage rounds starting soon
  const phaseMap = new Map<string, MatchFull[]>();
  for (const m of Object.values(allMatches)) {
    if (!m.round) continue;
    const isGroupStage =
      m.round.toLowerCase().includes('group') ||
      m.round.toLowerCase().includes('fase de grupos') ||
      m.round.toLowerCase().includes('first stage');
    if (isGroupStage) continue;

    const firstMatchMs = m.timestamp * 1000;
    if (firstMatchMs > now && firstMatchMs <= lookahead) {
      const list = phaseMap.get(m.round) ?? [];
      list.push(m);
      phaseMap.set(m.round, list);
    }
  }

  for (const [phase, phaseMatches] of phaseMap) {
    const phaseKey = phase
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    if (notified[phaseKey]) {
      logger.info(`Phase "${phase}" already notified, skipping`);
      continue;
    }

    phaseMatches.sort((a, b) => a.timestamp - b.timestamp);

    const matchRows = phaseMatches
      .map((m) =>
        buildMatchRow(m.homeName, m.awayName, fmtArgTime(m.timestamp), fmtArgTime(m.timestamp - 10 * 60))
      )
      .join('');

    const phaseName = translateRound(phase);
    const subject = `🏆 Empieza ${phaseName} — cargá tus predicciones`;

    const html = buildEmailHtml({
      icon: '🏆',
      title: phaseName,
      subtitle: 'Nueva fase del torneo',
      body: `<p style="margin:0 0 8px;font-size:16px;color:#f3f4f6;">
        ¡Arranca <strong style="color:#fff;">${phaseName}</strong>! Cargá tus predicciones antes de que empiece cada partido:
      </p>
      <p style="margin:0;font-size:13px;color:#9ca3af;">
        Las predicciones cierran <strong style="color:#f59e0b;">10 minutos antes</strong> de cada partido — podés predecir partido a partido.
      </p>`,
      matchRows,
    });

    const emails: ResendEmail[] = Object.values(users)
      .filter((u) => u.email)
      .map((u) => ({
        from: `${fromName} <${fromEmail}>`,
        to: [u.email],
        subject,
        html,
      }));

    if (emails.length > 0) {
      logger.info(`Sending phase start notification for "${phase}" to ${emails.length} users`);
      await sendBatch(emails, resendApiKey);
    }

    // Mark as notified so we don't send again tomorrow
    await db.ref(`notifications/phasesNotified/${phaseKey}`).set(true);
    logger.info(`Phase "${phase}" marked as notified`);
  }
});

// ─── Test endpoint (remove before going public) ───────────────────────────────

/**
 * HTTP endpoint to manually trigger the weekly reminder for a single email.
 * Usage: GET /testWeeklyReminder?secret=<TEST_SECRET>&to=<email>
 * Remove this function once email sending is verified.
 */
export const testWeeklyReminder = onRequest(async (req, res) => {
  const secret = process.env.TEST_SECRET;
  if (!secret || req.query['secret'] !== secret) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const to = req.query['to'] as string | undefined;
  if (!to) {
    res.status(400).json({ error: 'Missing ?to= parameter' });
    return;
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'noreply@example.com';
  const fromName = process.env.RESEND_FROM_NAME ?? 'FIFA WC 2026 Pool';

  if (!resendApiKey) {
    res.status(500).json({ error: 'RESEND_API_KEY not configured' });
    return;
  }

  // Use the next 7 days window
  const now = Date.now();
  const windowEnd = now + 7 * 24 * 60 * 60 * 1000;

  const matchesSnap = await db.ref('matches').once('value');
  const allMatches = matchesSnap.val() as Record<string, MatchFull> | null;

  const upcoming = allMatches
    ? Object.entries(allMatches)
        .filter(([, m]) => {
          const dl = m.timestamp * 1000 - 10 * 60 * 1000;
          return dl > now && dl <= windowEnd;
        })
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)
        .slice(0, 5) // max 5 for the test
    : [];

  const matchRows = upcoming
    .map(([, m]) =>
      buildMatchRow(m.homeName, m.awayName, fmtArgTime(m.timestamp), fmtArgTime(m.timestamp - 10 * 60))
    )
    .join('');

  const html = buildEmailHtml({
    icon: '⚽',
    title: APP_NAME,
    subtitle: 'Email de prueba',
    body: `<p style="margin:0;font-size:16px;color:#f3f4f6;">
      Este es un <strong style="color:#f59e0b;">email de prueba</strong>. Así se ve el recordatorio semanal con los próximos ${upcoming.length} partido(s):
    </p>`,
    matchRows,
    footerNote: `EMAIL DE PRUEBA — ${APP_NAME}`,
  });

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${fromName} <${fromEmail}>`,
      to: [to],
      subject: `⚽ [PRUEBA] Recordatorio de partidos — ${APP_NAME}`,
      html,
    }),
  });

  const result = await response.json() as unknown;
  res.status(response.ok ? 200 : 500).json({ ok: response.ok, resend: result });
});

// ─── Welcome email ────────────────────────────────────────────────────────────

/**
 * Fires when a new user record is created in /users/{uid}.
 * Sends a welcome email explaining the scoring system.
 */
export const sendWelcomeEmail = onValueCreated('/users/{uid}', async (event) => {
  const userData = event.data.val() as UserData | null;
  if (!userData?.email) return;

  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'noreply@example.com';
  const fromName = process.env.RESEND_FROM_NAME ?? APP_NAME;

  if (!resendApiKey) {
    logger.error('RESEND_API_KEY not configured');
    return;
  }

  const name = userData.displayName || userData.email.split('@')[0];

  const html = buildEmailHtml({
    icon: '🏆',
    title: '¡Bienvenido!',
    subtitle: APP_NAME,
    body: `
      <p style="margin:0 0 16px;font-size:16px;color:#f3f4f6;">
        Hola <strong style="color:#fff;">${name}</strong>, ¡ya sos parte del ${APP_NAME}! 🎉
      </p>
      <p style="margin:0 0 16px;font-size:14px;color:#9ca3af;line-height:1.6;">
        El Mundial empieza el <strong style="color:#fff;">11 de junio de 2026</strong>. Antes de cada partido podés predecir el marcador — mientras más acertás, más puntos sumás.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #1f2937;border-radius:8px;overflow:hidden;font-size:14px;margin-bottom:16px;">
        <thead>
          <tr style="background:#1f2937;">
            <th style="padding:10px 16px;text-align:left;color:#9ca3af;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Resultado</th>
            <th style="padding:10px 16px;text-align:center;color:#9ca3af;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Puntos</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding:12px 16px;border-bottom:1px solid #1f2937;color:#e5e7eb;">Resultado exacto (ej: 2-1 y ganó 2-1)</td>
            <td style="padding:12px 16px;border-bottom:1px solid #1f2937;color:#34d399;font-weight:700;text-align:center;">15 pts 🥳</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;border-bottom:1px solid #1f2937;color:#e5e7eb;">Ganador + diferencia de goles correcta</td>
            <td style="padding:12px 16px;border-bottom:1px solid #1f2937;color:#34d399;font-weight:700;text-align:center;">12 pts</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;border-bottom:1px solid #1f2937;color:#e5e7eb;">Solo el ganador (o empate) correcto</td>
            <td style="padding:12px 16px;border-bottom:1px solid #1f2937;color:#34d399;font-weight:700;text-align:center;">8 pts</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;color:#6b7280;">Ninguno</td>
            <td style="padding:12px 16px;color:#6b7280;text-align:center;">0 pts</td>
          </tr>
        </tbody>
      </table>
      <p style="margin:0;font-size:13px;color:#6b7280;text-align:center;">
        Las predicciones cierran <strong style="color:#f59e0b;">10 minutos antes</strong> de cada partido.
      </p>
    `,
    footerNote: `${APP_NAME} · Te registraste en la plataforma.`,
  });

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${fromName} <${fromEmail}>`,
      to: [userData.email],
      subject: `⚽ ¡Bienvenido al ${APP_NAME}!`,
      html,
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    logger.error(`Welcome email failed for ${userData.email}: ${txt}`);
  } else {
    logger.info(`Welcome email sent to ${userData.email}`);
  }
});
