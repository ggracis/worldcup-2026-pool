import { useEffect, useMemo, useState } from 'react';
import {
  subscribeToLeaderboard,
  type UserWithId,
} from '../services/userService';
import { computeWinnersByGame, type WinnerBrief } from '../utils/standings';
import { useAllPredictions } from './useAllPredictions';
import { useMatches } from './useMatches';

/**
 * Mapa gameId -> usuarios que acertaron el resultado exacto, para mostrar
 * "quiénes le pegaron" en cada partido. Combina las predicciones globales,
 * los partidos y los nombres de usuario.
 */
export const useWinnersByGame = (): Record<string, WinnerBrief[]> => {
  const { allPredictions } = useAllPredictions();
  const { matches } = useMatches();
  const [users, setUsers] = useState<UserWithId[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToLeaderboard(setUsers);
    return () => unsubscribe();
  }, []);

  return useMemo(() => {
    if (!allPredictions || !matches || users.length === 0) return {};
    return computeWinnersByGame(allPredictions, users, matches);
  }, [allPredictions, matches, users]);
};
