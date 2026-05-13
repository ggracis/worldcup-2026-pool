import React from 'react';
import { type Match, type Prediction, savePrediction } from '../../services';
import { Card } from '../ui/Card';

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

type MatchCardProps = {
  match: Match;
  isOwnProfile?: boolean;
  userId?: string;
  prediction?: Prediction;
};

export const MatchCard = ({
  match,
  isOwnProfile = false,
  userId,
  prediction,
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

  const [homePrediction, setHomePrediction] = React.useState<string>(
    prediction?.homePrediction?.toString() ?? ''
  );
  const [awayPrediction, setAwayPrediction] = React.useState<string>(
    prediction?.awayPrediction?.toString() ?? ''
  );
  const [saving, setSaving] = React.useState(false);

  // Update local state when prediction prop changes
  React.useEffect(() => {
    if (prediction) {
      setHomePrediction(prediction.homePrediction?.toString() ?? '');
      setAwayPrediction(prediction.awayPrediction?.toString() ?? '');
    }
  }, [prediction]);

  const handleSavePrediction = async () => {
    if (!userId || !canPredict) return;

    const home = parseInt(homePrediction, 10);
    const away = parseInt(awayPrediction, 10);

    if (isNaN(home) || isNaN(away) || home < 0 || away < 0) return;

    setSaving(true);
    try {
      await savePrediction(userId, match.game, home, away);
    } catch (error) {
      console.error('Error saving prediction:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleBlur = () => {
    if (homePrediction !== '' && awayPrediction !== '') {
      void handleSavePrediction();
    }
  };

  const inputClass =
    'w-10 h-8 text-center bg-white/10 border border-white/20 rounded text-white text-lg font-bold focus:outline-none focus:border-white/40 disabled:opacity-50';
  const scoreClass =
    'w-10 h-8 flex items-center justify-center text-lg font-bold';
  const predictionClass =
    'w-10 h-8 flex items-center justify-center bg-blue-600/30 border border-blue-400/30 rounded text-lg font-bold';

  const dateString = matchDate.toLocaleDateString('es-AR', {
    month: 'short',
    day: 'numeric',
    timeZone: ARG_TZ,
  });

  const showPoints = isPlayed && prediction;

  return (
    <Card className="p-4 hover:bg-white/10 transition-colors after:hidden">
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
                maxLength={2}
                value={homePrediction}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                  setHomePrediction(val);
                }}
                onFocus={(e) => e.target.select()}
                onBlur={handleBlur}
                className={inputClass}
                disabled={saving}
                placeholder="-"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                data-form-type="other"
              />
            )}
            {!canPredict && prediction && (
              <span className={predictionClass}>
                {prediction.homePrediction}
              </span>
            )}
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
                maxLength={2}
                value={awayPrediction}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                  setAwayPrediction(val);
                }}
                onFocus={(e) => e.target.select()}
                onBlur={handleBlur}
                className={inputClass}
                disabled={saving}
                placeholder="-"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                data-form-type="other"
              />
            )}
            {!canPredict && prediction && (
              <span className={predictionClass}>
                {prediction.awayPrediction}
              </span>
            )}
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
