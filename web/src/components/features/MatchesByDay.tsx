import { useEffect, useRef } from 'react';
import {
  type Match,
  type MatchesData,
  type UserPredictions,
} from '../../services';
import { type WinnerBrief } from '../../utils';
import { MatchCard } from './MatchCard';

const ARG_TZ = 'America/Argentina/Buenos_Aires';

type MatchesByDayProps = {
  matches: MatchesData;
  isOwnProfile?: boolean;
  userId?: string;
  predictions?: UserPredictions;
  winnersByGame?: Record<string, WinnerBrief[]>;
};

export const MatchesByDay = ({
  matches,
  isOwnProfile,
  userId,
  predictions,
  winnersByGame,
}: MatchesByDayProps) => {
  // Group matches by date (day)
  const groupedByDay = Object.values(matches).reduce<Record<string, Match[]>>(
    (acc, match) => {
      const date = new Date(match.date);
      const dayKey = date.toLocaleDateString('es-AR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'America/Argentina/Buenos_Aires',
      });

      if (!acc[dayKey]) {
        acc[dayKey] = [];
      }
      acc[dayKey].push(match);
      return acc;
    },
    {}
  );

  // Sort days chronologically
  const sortedDays = Object.keys(groupedByDay).sort((a, b) => {
    const dateA = new Date(groupedByDay[a][0].date);
    const dateB = new Date(groupedByDay[b][0].date);
    return dateA.getTime() - dateB.getTime();
  });

  // Día al que queremos scrollear: hoy, o el primer día futuro con partidos.
  // Comparamos como 'YYYY-MM-DD' en hora Argentina (orden lexicográfico = cronológico).
  const todayArg = new Date().toLocaleDateString('sv-SE', { timeZone: ARG_TZ });
  const targetDay = sortedDays.find(
    (day) =>
      new Date(groupedByDay[day][0].date).toLocaleDateString('sv-SE', {
        timeZone: ARG_TZ,
      }) >= todayArg
  );

  const targetRef = useRef<HTMLDivElement>(null);
  const scrolledRef = useRef(false);
  useEffect(() => {
    if (!scrolledRef.current && targetRef.current) {
      targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      scrolledRef.current = true;
    }
  }, [targetDay]);

  return (
    <div className="flex flex-col gap-6">
      {sortedDays.map((day) => (
        <div
          key={day}
          ref={day === targetDay ? targetRef : undefined}
          className="scroll-mt-20"
        >
          <h3 className="text-lg font-semibold mb-3 text-white/80 pb-2">
            {day}
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {groupedByDay[day]
              .sort((a, b) => a.timestamp - b.timestamp)
              .map((match) => (
                <MatchCard
                  key={match.game}
                  match={match}
                  isOwnProfile={isOwnProfile}
                  userId={userId}
                  prediction={predictions?.[match.game]}
                  winners={winnersByGame?.[String(match.game)]}
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};
