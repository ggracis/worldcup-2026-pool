import React from 'react';
import {
  AppLayout,
  MatchesByDay,
  MatchesByGroup,
  MatchesHeader,
} from '../components';
import { useMatches } from '../hooks';
import type { MatchesData } from '../services';

type ViewMode = 'day' | 'group';

const isArgentinaMatch = (m: MatchesData[string]) =>
  m.home === 'ARG' || m.away === 'ARG' ||
  m.homeName === 'Argentina' || m.awayName === 'Argentina';

export const Home = () => {
  const { matches, loading, error } = useMatches();
  const [viewMode, setViewMode] = React.useState<ViewMode>('day');
  const [showArgentina, setShowArgentina] = React.useState(false);

  // Hide splash once data is loaded
  React.useEffect(() => {
    if (!loading && (matches || error)) {
      window.hideSplash?.();
    }
  }, [loading, matches, error]);

  const visibleMatches = React.useMemo(() => {
    if (!matches || !showArgentina) return matches;
    return Object.fromEntries(
      Object.entries(matches).filter(([, m]) => isArgentinaMatch(m))
    );
  }, [matches, showArgentina]);

  return (
    <AppLayout>
      <div className="pt-8 px-4 pb-8 max-w-4xl mx-auto">
        <MatchesHeader
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          showArgentina={showArgentina}
          onArgentinaFilter={setShowArgentina}
        />

        {loading && (
          <div className="text-center text-white/70">Loading matches...</div>
        )}

        {error && (
          <div className="text-center text-red-400">Error: {error}</div>
        )}

        {visibleMatches &&
          (viewMode === 'day' ? (
            <MatchesByDay matches={visibleMatches} />
          ) : (
            <MatchesByGroup matches={visibleMatches} />
          ))}
      </div>
    </AppLayout>
  );
};
