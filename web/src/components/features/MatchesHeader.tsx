import { Chip } from '../ui/Chip';

type ViewMode = 'day' | 'group';

type MatchesHeaderProps = {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  showArgentina?: boolean;
  onArgentinaFilter?: (val: boolean) => void;
  title?: string;
};

export const MatchesHeader = ({
  viewMode,
  onViewModeChange,
  showArgentina = false,
  onArgentinaFilter,
  title = 'Partidos',
}: MatchesHeaderProps) => {
  return (
    <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
      <h2 className="text-3xl font-bold leading-none">{title}</h2>
      <div className="flex items-center gap-2 flex-wrap">
        <Chip active={showArgentina} onClick={() => onArgentinaFilter?.(!showArgentina)}>
          🇦🇷 Argentina
        </Chip>
        <Chip active={viewMode === 'day'} onClick={() => onViewModeChange('day')}>
          Por fecha
        </Chip>
        <Chip active={viewMode === 'group'} onClick={() => onViewModeChange('group')}>
          Por grupo
        </Chip>
      </div>
    </div>
  );
};
