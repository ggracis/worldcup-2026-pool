import { type AllPredictions } from '../services/predictionService';
import { type MatchesData } from '../services/matchService';
import { type UserWithId } from '../services/userService';

const isPlayed = (m: { homeScore: number; awayScore: number }): boolean =>
  m.homeScore >= 0 && m.awayScore >= 0;

/**
 * Ids (string) de los partidos jugados en las últimas `windowHours` horas
 * (por kickoff). Usamos una ventana móvil en vez de "día calendario" para que
 * el movimiento sea estable y no se resetee a medianoche.
 */
export const getRecentlyPlayedGames = (
  matches: MatchesData,
  windowHours = 24
): string[] => {
  const now = Date.now();
  const since = now - windowHours * 60 * 60 * 1000;
  return Object.values(matches)
    .filter(
      (m) => isPlayed(m) && m.timestamp * 1000 >= since && m.timestamp * 1000 <= now
    )
    .map((m) => String(m.game));
};

/** Puntos que sumó cada usuario en los partidos recientes (ventana de 24h). */
export const computeRecentPoints = (
  allPredictions: AllPredictions,
  recentGames: string[]
): Record<string, number> => {
  const result: Record<string, number> = {};
  for (const [uid, preds] of Object.entries(allPredictions)) {
    if (!preds) continue;
    let sum = 0;
    for (const gameId of recentGames) {
      const p = preds[gameId];
      if (p && typeof p === 'object') sum += p.points || 0;
    }
    result[uid] = sum;
  }
  return result;
};

export interface RecentMovement {
  /** Lugares movidos en las últimas 24h: >0 subió, <0 bajó, 0 sin cambio. */
  deltaPositions: number;
  /** Puntos sumados en las últimas 24h. */
  points: number;
}

/**
 * Movimiento de cada usuario en las últimas 24h, calculado SIN historial:
 * la posición de hace 24h se reconstruye ordenando por (score - puntos recientes).
 * Se calcula sobre el mismo conjunto `users` que se muestra (global o liga).
 */
export const computeRecentMovement = (
  users: UserWithId[],
  recentPoints: Record<string, number>
): Record<string, RecentMovement> => {
  const scoreBefore = (u: UserWithId): number =>
    u.score - (recentPoints[u.id] || 0);

  // Posición de hace 24h (índice en el ranking reconstruido)
  const posBefore: Record<string, number> = {};
  [...users]
    .sort((a, b) => scoreBefore(b) - scoreBefore(a))
    .forEach((u, i) => {
      posBefore[u.id] = i;
    });

  const movement: Record<string, RecentMovement> = {};
  users.forEach((u, posNow) => {
    movement[u.id] = {
      // antes índice mayor (más abajo) → ahora subió → positivo
      deltaPositions: posBefore[u.id] - posNow,
      points: recentPoints[u.id] || 0,
    };
  });
  return movement;
};

export interface WinnerBrief {
  id: string;
  userName: string;
  displayName: string;
  photoURL: string;
}

/**
 * Para cada partido jugado, la lista de usuarios que acertaron el resultado
 * EXACTO (15 puntos). Solo incluye partidos con al menos un acierto.
 */
export const computeWinnersByGame = (
  allPredictions: AllPredictions,
  users: UserWithId[],
  matches: MatchesData
): Record<string, WinnerBrief[]> => {
  const playedGames = new Set(
    Object.values(matches)
      .filter(isPlayed)
      .map((m) => String(m.game))
  );
  const usersById = new Map(users.map((u) => [u.id, u]));

  const result: Record<string, WinnerBrief[]> = {};
  for (const [uid, preds] of Object.entries(allPredictions)) {
    if (!preds) continue;
    const user = usersById.get(uid);
    if (!user) continue;
    for (const [gameId, p] of Object.entries(preds)) {
      if (!p || typeof p !== 'object') continue;
      if (p.points !== 15 || !playedGames.has(gameId)) continue;
      (result[gameId] ??= []).push({
        id: uid,
        userName: user.userName,
        displayName: user.displayName,
        photoURL: user.photoURL,
      });
    }
  }
  return result;
};
