import { AppLayout, Card } from '../components';

export const Rules = () => {
  return (
    <AppLayout>
      <div className="pt-8 px-4 pb-8 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Reglamento</h1>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Cierre de predicciones
          </h2>
          <div className="flex items-start gap-3 text-white/80">
            <span className="text-2xl">⏰</span>
            <p>
              Las predicciones deben cargarse{' '}
              <span className="text-white font-semibold">
                al menos 10 minutos antes del inicio del partido
              </span>
              . Pasado ese tiempo, las predicciones se bloquean y no pueden modificarse.
            </p>
          </div>
        </Card>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Cómo se calculan los puntos
          </h2>

          <div className="space-y-4 text-white/80">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🥳</span>
              <div>
                <h3 className="font-semibold text-white">
                  Resultado exacto — 15 puntos
                </h3>
                <p className="text-sm">
                  Acertás el marcador final de ambos equipos.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-2xl">😄</span>
              <div>
                <h3 className="font-semibold text-white">
                  Ganador correcto — hasta 10 puntos
                </h3>
                <p className="text-sm">
                  Acertás quién gana (o que es empate) pero no el marcador exacto.
                  Puntos = 10 menos la diferencia entre tu predicción y el resultado real.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-2xl">😔</span>
              <div>
                <h3 className="font-semibold text-white">
                  Resultado incorrecto — 0 puntos
                </h3>
                <p className="text-sm">
                  Erraste quién gana o el empate.
                </p>
              </div>
            </div>
          </div>

          <h2 className="mt-8 text-xl font-semibold text-white mb-4">
            Ejemplos
          </h2>

          <div className="space-y-6">
            {/* Ejemplo 1: Exacto */}
            <div className="border-b border-white/10 pb-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                <span className="text-white/60 text-sm">Resultado real</span>
                <span className="text-white font-mono">México 2 - 1 Sudáfrica</span>
              </div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                <span className="text-white/60 text-sm">Tu predicción</span>
                <span className="text-white font-mono">México 2 - 1 Sudáfrica</span>
              </div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <span className="text-white/60 text-sm">Puntos</span>
                <span className="text-green-400 font-bold">🥳 15 puntos (¡Exacto!)</span>
              </div>
            </div>

            {/* Ejemplo 2: Ganador correcto */}
            <div className="border-b border-white/10 pb-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                <span className="text-white/60 text-sm">Resultado real</span>
                <span className="text-white font-mono">Brasil 2 - 1 Marruecos</span>
              </div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                <span className="text-white/60 text-sm">Tu predicción</span>
                <span className="text-white font-mono">Brasil 3 - 0 Marruecos</span>
              </div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <span className="text-white/60 text-sm">Puntos</span>
                <div className="md:text-right">
                  <span className="text-yellow-400 font-bold">😄 8 puntos</span>
                  <div className="text-white/40 text-xs font-mono">
                    10 - |3-2| - |0-1| = 8
                  </div>
                </div>
              </div>
            </div>

            {/* Ejemplo 3: Empate correcto */}
            <div className="border-b border-white/10 pb-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                <span className="text-white/60 text-sm">Resultado real</span>
                <span className="text-white font-mono">Países Bajos 2 - 2 Japón</span>
              </div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                <span className="text-white/60 text-sm">Tu predicción</span>
                <span className="text-white font-mono">Países Bajos 0 - 0 Japón</span>
              </div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <span className="text-white/60 text-sm">Puntos</span>
                <div className="md:text-right">
                  <span className="text-yellow-400 font-bold">😄 6 puntos</span>
                  <div className="text-white/40 text-xs font-mono">
                    10 - |0-2| - |0-2| = 6
                  </div>
                </div>
              </div>
            </div>

            {/* Ejemplo 4: Resultado incorrecto */}
            <div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                <span className="text-white/60 text-sm">Resultado real</span>
                <span className="text-white font-mono">Inglaterra 2 - 1 Croacia</span>
              </div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                <span className="text-white/60 text-sm">Tu predicción</span>
                <span className="text-white font-mono">Inglaterra 0 - 2 Croacia</span>
              </div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <span className="text-white/60 text-sm">Puntos</span>
                <span className="text-red-400 font-bold">
                  😔 0 puntos (resultado incorrecto)
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
};
