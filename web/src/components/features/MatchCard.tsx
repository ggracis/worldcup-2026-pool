import React from 'react';
import { Link } from 'react-router-dom';
import { type Match, type Prediction, savePrediction } from '../../services';
import { type WinnerBrief, isRestrictedKnockoutRound } from '../../utils';
import { Card } from '../ui/Card';
import { ProfilePicture } from '../ui';

const TEAM_NAMES_ES: Record<string, string> = {
  'United States': 'Estados Unidos',
  USA: 'EE.UU.',
  England: 'Inglaterra',
  Netherlands: 'Países Bajos',
  Switzerland: 'Suiza',
  Germany: 'Alemania',
  Poland: 'Polonia',
  Hungary: 'Hungría',
  Belgium: 'Bélgica',
  Turkey: 'Turquía',
  Türkiye: 'Turquía',
  Greece: 'Grecia',
  Romania: 'Rumania',
  Ukraine: 'Ucrania',
  'Czech Republic': 'Rep. Checa',
  Iceland: 'Islandia',
  Slovakia: 'Eslovaquia',
  Slovenia: 'Eslovenia',
  Wales: 'Gales',
  Ireland: 'Irlanda',
  'South Korea': 'Corea del Sur',
  'North Korea': 'Corea del Norte',
  'Saudi Arabia': 'Arabia Saudita',
  Japan: 'Japón',
  Iran: 'Irán',
  'New Zealand': 'Nueva Zelanda',
  Morocco: 'Marruecos',
  'Ivory Coast': 'Costa de Marfil',
  "Côte d'Ivoire": 'Costa de Marfil',
  'South Africa': 'Sudáfrica',
  Cameroon: 'Camerún',
  Tunisia: 'Túnez',
  Egypt: 'Egipto',
  Nigeria: 'Nigeria',
  Brazil: 'Brasil',
  Mexico: 'México',
  Serbia: 'Serbia',
  Portugal: 'Portugal',
  Australia: 'Australia',
  Ghana: 'Ghana',
  Senegal: 'Senegal',
  Kenya: 'Kenia',
  Tanzania: 'Tanzania',
  Uganda: 'Uganda',
  Albania: 'Albania',
  Montenegro: 'Montenegro',
  Bosnia: 'Bosnia',
  // Nombres que usa la API de FIFA
  Czechia: 'Rep. Checa',
  'Korea Republic': 'Corea del Sur',
  'Bosnia and Herzegovina': 'Bosnia y Herzegovina',
  Sweden: 'Suecia',
  Spain: 'España',
  'IR Iran': 'Irán',
  Norway: 'Noruega',
  Croatia: 'Croacia',
  Denmark: 'Dinamarca',
  Finland: 'Finlandia',
  Russia: 'Rusia',
  Scotland: 'Escocia',

  'DR Congo': 'Rep. Dem. del Congo',
  'Equatorial Guinea': 'Guinea Ecuatorial',
  'Cape Verde': 'Cabo Verde',
  'Burkina Faso': 'Burkina Faso',
  'Chinese Taipei': 'Taiwán',
  Oman: 'Omán',
  Qatar: 'Catar',
  'United Arab Emirates': 'Emiratos Árabes',
  'Costa Rica': 'Costa Rica',
  'Trinidad and Tobago': 'Trinidad y Tobago',
  'El Salvador': 'El Salvador',
  Honduras: 'Honduras',
  Jamaica: 'Jamaica',
  Panama: 'Panamá',
  Cuba: 'Cuba',
  Haiti: 'Haití',
  Bolivia: 'Bolivia',
  Chile: 'Chile',
  Colombia: 'Colombia',
  Ecuador: 'Ecuador',
  Paraguay: 'Paraguay',
  Peru: 'Perú',
  Uruguay: 'Uruguay',
  Venezuela: 'Venezuela',
};

const translateTeam = (name: string): string => TEAM_NAMES_ES[name] ?? name;

// Import all flags dynamically
const flagModules: Record<string, string> = import.meta.glob(
  '../../assets/flags/*.png',
  { eager: true, import: 'default' }
);

const getFlag = (code: string): string => {
  return (
    flagModules[`../../assets/flags/${code}.png`] ??
    flagModules['../../assets/flags/UNKNOWN.png']
  );
};

// Salta al siguiente input de pronóstico en toda la lista (cruza de card en card).
// Marcamos cada input con [data-pred-input] y nos movemos por orden de aparición en el DOM.
const focusNextPredictionInput = (current: HTMLInputElement): void => {
  const inputs = Array.from(
    document.querySelectorAll<HTMLInputElement>('[data-pred-input]')
  );
  const idx = inputs.indexOf(current);
  if (idx >= 0 && idx + 1 < inputs.length) {
    inputs[idx + 1].focus();
  }
};

/** Botón minimalista que despliega quiénes le pegaron al resultado exacto. */
const WinnersButton = ({ winners }: { winners: WinnerBrief[] }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        title={`${winners.length} le pegó al resultado exacto`}
        className="flex items-center gap-1 text-white/40 hover:text-white/80 transition-colors"
      >
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        <span className="text-xs font-semibold tabular-nums">
          {winners.length}
        </span>
      </button>
      {open && (
        <div className="absolute right-0 bottom-full mb-2 w-52 max-h-60 overflow-y-auto bg-black/90 backdrop-blur-lg border border-white/10 rounded-lg p-2 z-30 shadow-xl">
          <div className="text-[10px] uppercase tracking-wider text-white/40 px-1 pb-1">
            Le pegaron al resultado
          </div>
          {winners.map((w) => (
            <Link
              key={w.id}
              to={`/${w.userName}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 px-1 py-1 rounded hover:bg-white/10 transition-colors"
            >
              <ProfilePicture src={w.photoURL} name={w.displayName} size="xs" />
              <span className="text-sm text-white/90 truncate">
                {w.displayName}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

type MatchCardProps = {
  match: Match;
  isOwnProfile?: boolean;
  userId?: string;
  prediction?: Prediction;
  winners?: WinnerBrief[];
};

export const MatchCard = ({
  match,
  isOwnProfile = false,
  userId,
  prediction,
  winners,
}: MatchCardProps) => {
  const matchDate = new Date(match.date);
  const ARG_TZ = 'America/Argentina/Buenos_Aires';
  const timeString = matchDate.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: ARG_TZ,
  });
  const isPlayed = match.homeScore >= 0 && match.awayScore >= 0;
  const cutoffTime = match.timestamp * 1000 - 10 * 60 * 1000;
  const predictionsClosed = Date.now() > cutoffTime;

  const kickoffTime = match.timestamp * 1000;
  const matchEndEstimate = kickoffTime + 150 * 60 * 1000;
  const isLive =
    !isPlayed && Date.now() >= kickoffTime && Date.now() < matchEndEstimate;
  const isUpcoming = !isPlayed && !isLive;

  const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(`${match.homeName} vs ${match.awayName}`)}`;

  const calendarUrl = (() => {
    const start = new Date(kickoffTime);
    const end = new Date(kickoffTime + 2 * 60 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';
    const title = encodeURIComponent(`${translateTeam(match.homeName)} vs ${translateTeam(match.awayName)} — FIFA World Cup 2026`);
    const loc = encodeURIComponent(`${match.location}, ${match.locationCity}`);
    const details = encodeURIComponent(match.group ? `Grupo ${match.group}` : match.round);
    return `https://calendar.google.com/calendar/r/eventedit?text=${title}&dates=${fmt(start)}/${fmt(end)}&location=${loc}&details=${details}`;
  })();
  const canPredict = isOwnProfile && userId && !predictionsClosed;

  // De octavos en adelante, la predicción de OTRO usuario se oculta hasta que
  // el partido se bloquea (10 min antes del inicio). Sólo es un ocultamiento
  // visual; el dato sigue siendo público a nivel de base.
  const hideOpponentPrediction =
    !isOwnProfile &&
    !predictionsClosed &&
    isRestrictedKnockoutRound(match.round);

  const [homePrediction, setHomePrediction] = React.useState<string>(
    prediction?.homePrediction?.toString() ?? ''
  );
  const [awayPrediction, setAwayPrediction] = React.useState<string>(
    prediction?.awayPrediction?.toString() ?? ''
  );
  const [saving, setSaving] = React.useState(false);
  // Solo estados transitorios: 'saving' mientras escribe en DB, 'error' si falla.
  // El ✓ verde NO es un estado con timeout: se deriva de que lo tipeado coincida
  // con lo guardado (ver isSavedMatch), así se mantiene visible de forma persistente.
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'error'>(
    'idle'
  );

  // Update local state when prediction prop changes
  React.useEffect(() => {
    if (prediction) {
      setHomePrediction(prediction.homePrediction?.toString() ?? '');
      setAwayPrediction(prediction.awayPrediction?.toString() ?? '');
    }
  }, [prediction]);

  const persistPrediction = async (home: number, away: number) => {
    if (!userId || !canPredict) return;

    setSaving(true);
    setSaveStatus('saving');
    try {
      await savePrediction(userId, match.game, home, away);
      // Al volver 'idle', el ✓ verde lo provee isSavedMatch (persistente).
      setSaveStatus('idle');
    } catch (error) {
      console.error('Error saving prediction:', error);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  // Guarda en cuanto ambos campos están completos. Recibe los valores frescos
  // del evento (no del estado) para no depender del timing de re-render de React.
  const saveIfComplete = (homeStr: string, awayStr: string) => {
    if (homeStr === '' || awayStr === '') return;
    const home = parseInt(homeStr, 10);
    const away = parseInt(awayStr, 10);
    if (isNaN(home) || isNaN(away) || home < 0 || away < 0) return;
    void persistPrediction(home, away);
  };

  const inputClass =
    'w-10 h-8 text-center bg-white/10 border border-white/20 rounded text-white text-lg font-bold focus:outline-none focus:border-white/40 disabled:opacity-50';
  const scoreClass =
    'w-10 h-8 flex items-center justify-center text-lg font-bold';
  const predictionClass =
    'w-10 h-8 flex items-center justify-center bg-blue-600/30 border border-blue-400/30 rounded text-lg font-bold';
  const lockedPredictionClass =
    'w-10 h-8 flex items-center justify-center bg-white/5 border border-white/10 rounded text-sm';

  // ¿Lo que está en los inputs coincide con lo guardado en la base? → ✓ persistente
  const isSavedMatch =
    !!prediction &&
    homePrediction !== '' &&
    awayPrediction !== '' &&
    parseInt(homePrediction, 10) === prediction.homePrediction &&
    parseInt(awayPrediction, 10) === prediction.awayPrediction;

  const showSpinner = saveStatus === 'saving';
  const showError = saveStatus === 'error';
  const showSaved = !showSpinner && !showError && isSavedMatch;

  // Indicador chiquito de estado del guardado (al lado de cada input)
  const saveIndicator = (
    <span
      className="w-4 h-4 flex items-center justify-center shrink-0"
      title={
        showError
          ? 'No se pudo guardar, reintentá'
          : showSaved
            ? 'Guardado'
            : showSpinner
              ? 'Guardando…'
              : undefined
      }
    >
      {showSpinner && (
        <svg className="w-4 h-4 animate-spin text-white/40" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
        </svg>
      )}
      {showSaved && (
        <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
      {showError && (
        <svg className="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      )}
    </span>
  );

  // Resaltado del card cuando me falta cargar (solo partidos abiertos):
  // naranja si el partido es HOY, amarillo si es a futuro.
  const todayArg = new Date().toLocaleDateString('sv-SE', { timeZone: ARG_TZ });
  const matchDayArg = matchDate.toLocaleDateString('sv-SE', { timeZone: ARG_TZ });
  const isMatchToday = todayArg === matchDayArg;
  const needsPrediction = !!canPredict && !prediction;
  const highlightClass = !needsPrediction
    ? ''
    : isMatchToday
      ? 'ring-2 ring-orange-400/60 bg-orange-500/10'
      : 'ring-1 ring-yellow-300/40 bg-yellow-300/[0.06]';

  const dateString = matchDate.toLocaleDateString('es-AR', {
    month: 'short',
    day: 'numeric',
    timeZone: ARG_TZ,
  });

  const showPoints = isPlayed && prediction;

  return (
    <Card
      className={`p-4 hover:bg-white/10 transition-colors after:hidden ${highlightClass}`}
    >
      {/* Teams and Points Row */}
      <div className="flex gap-3 mb-3">
        {/* Team Rows */}
        <div className="flex-1">
          {/* Home Team Row */}
          <div className="flex items-center gap-2 md:gap-3 mb-2">
            <img
              src={getFlag(match.home)}
              alt={match.home}
              className="h-6 w-9 md:h-8 md:w-12 object-contain rounded-sm"
            />
            <span className="flex-1 font-medium text-sm md:text-base">
              {translateTeam(match.homeName)}
            </span>
            <span className={scoreClass}>
              {isPlayed ? match.homeScore : '-'}
            </span>
            {canPredict && (
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={homePrediction}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 1);
                  setHomePrediction(val);
                  if (val) {
                    saveIfComplete(val, awayPrediction);
                    focusNextPredictionInput(e.target);
                  }
                }}
                onFocus={(e) => e.target.select()}
                className={inputClass}
                disabled={saving}
                placeholder="-"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                data-form-type="other"
                data-pred-input
              />
            )}
            {!canPredict && hideOpponentPrediction && (
              <span
                className={lockedPredictionClass}
                title="Se revela cuando se cierra el partido"
              >
                🔒
              </span>
            )}
            {!canPredict && !hideOpponentPrediction && prediction && (
              <span className={predictionClass}>
                {prediction.homePrediction}
              </span>
            )}
            {canPredict && saveIndicator}
          </div>

          {/* Away Team Row */}
          <div className="flex items-center gap-2 md:gap-3">
            <img
              src={getFlag(match.away)}
              alt={match.away}
              className="h-6 w-9 md:h-8 md:w-12 object-contain rounded-sm"
            />
            <span className="flex-1 font-medium text-sm md:text-base">
              {translateTeam(match.awayName)}
            </span>
            <span className={scoreClass}>
              {isPlayed ? match.awayScore : '-'}
            </span>
            {canPredict && (
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={awayPrediction}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 1);
                  setAwayPrediction(val);
                  if (val) {
                    saveIfComplete(homePrediction, val);
                    focusNextPredictionInput(e.target);
                  }
                }}
                onFocus={(e) => e.target.select()}
                className={inputClass}
                disabled={saving}
                placeholder="-"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                data-form-type="other"
                data-pred-input
              />
            )}
            {!canPredict && hideOpponentPrediction && (
              <span
                className={lockedPredictionClass}
                title="Se revela cuando se cierra el partido"
              >
                🔒
              </span>
            )}
            {!canPredict && !hideOpponentPrediction && prediction && (
              <span className={predictionClass}>
                {prediction.awayPrediction}
              </span>
            )}
            {canPredict && saveIndicator}
          </div>
        </div>

        {/* Points Column */}
        {showPoints && (
          <div
            className={`flex flex-col items-center border rounded-lg w-14 ${
              prediction.points > 0
                ? 'border-green-500/20 bg-green-600/10'
                : 'border-red-500/20 bg-red-600/10'
            }`}
          >
            <span className="flex-1 flex items-center text-2xl">
              {prediction.points === 15
                ? '🥳'
                : prediction.points > 0
                  ? '😄'
                  : '😔'}
            </span>
            <span
              className={`flex items-center justify-center text-xs px-1 py-0.5 w-14 rounded-b ${
                prediction.points > 0
                  ? 'bg-green-800 text-white'
                  : 'bg-red-800 text-white'
              }`}
            >
              {prediction.points > 0
                ? `+${prediction.points}`
                : prediction.points}{' '}
              pts
            </span>
          </div>
        )}
      </div>

      {/* Footer: Group, Stadium, Date/Time, Icons */}
      <div className="flex items-center gap-2 text-xs text-white/50">
        {match.group && <span>Grupo: {match.group}</span>}
        {match.group && <span>·</span>}
        <span className="truncate">
          {match.locationCity}, {match.locationCountry}
        </span>
        <span>·</span>
        <span className="shrink-0">
          {dateString}, {timeString}
        </span>

        <div className="ml-auto flex items-center gap-2 shrink-0">
          {isPlayed && winners && winners.length > 0 && (
            <WinnersButton winners={winners} />
          )}
          {isUpcoming && (
            <a
              href={calendarUrl}
              target="_blank"
              rel="noreferrer"
              title="Agregar al calendario"
              className="text-white/40 hover:text-white/80 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </a>
          )}
          {!isPlayed && (
            <a
              href={googleSearchUrl}
              target="_blank"
              rel="noreferrer"
              title="Buscar en Google"
              className="text-white/40 hover:text-white/80 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </a>
          )}
          {isLive && (
            <span className="flex items-center gap-1.5 text-red-500 font-bold animate-pulse">
              <span className="w-2 h-2 bg-red-500 rounded-full" />
              EN VIVO
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};
