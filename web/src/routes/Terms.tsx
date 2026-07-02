import { AppLayout, Card } from '../components';

export const Terms = () => {
  return (
    <AppLayout>
      <div className="pt-8 px-4 pb-8 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Bases y Condiciones</h1>
        <p className="text-white/50 text-sm mb-8">Prode Mundial FIFA 2026 — Edición paga</p>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Participación
          </h2>
          <div className="space-y-4 text-white/80">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💸</span>
              <div>
                <h3 className="font-semibold text-white">Costo de inscripción</h3>
                <p className="text-sm">
                  El costo para participar es de{' '}
                  <span className="text-white font-semibold">$7.500 (ARS)</span>{' '}
                  por persona. La participación es individual e intransferible.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">📅</span>
              <div>
                <h3 className="font-semibold text-white">Fecha límite de validación</h3>
                <p className="text-sm">
                  El pago debe confirmarse{' '}
                  <span className="text-white font-semibold">
                    antes de las 23:59 hs del día previo al primer partido del torneo
                  </span>
                  . Quienes no hayan validado su pago en ese plazo no serán habilitados para participar.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <h3 className="font-semibold text-white">Habilitación</h3>
                <p className="text-sm">
                  La cuenta será habilitada manualmente por el administrador una vez confirmado el pago.
                  Hasta entonces, el acceso a la plataforma estará restringido.
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Premios
          </h2>
          <div className="space-y-4 text-white/80">
            <p className="text-sm">
              El pozo se forma con el 100% de las inscripciones y se distribuye al finalizar el torneo
              de la siguiente manera:
            </p>
            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🥇</span>
                <span className="text-white font-semibold">1.º puesto</span>
              </div>
              <span className="text-green-400 font-bold text-lg">70% del pozo</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🥈</span>
                <span className="text-white font-semibold">2.º puesto</span>
              </div>
              <span className="text-yellow-400 font-bold text-lg">20% del pozo</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🥉</span>
                <span className="text-white font-semibold">3.º puesto</span>
              </div>
              <span className="text-orange-400 font-bold text-lg">10% del pozo</span>
            </div>
            <p className="text-xs text-white/40 pt-2">
              Ejemplo: con 20 participantes el pozo es $150.000. El ganador se lleva $105.000,
              el segundo $30.000 y el tercero $15.000.
            </p>
          </div>
        </Card>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Desempate
          </h2>
          <div className="flex items-start gap-3 text-white/80">
            <span className="text-2xl">⚖️</span>
            <p className="text-sm">
              En caso de empate en la tabla de posiciones al finalizar el torneo,
              el desempate se resolverá por: (1) mayor cantidad de resultados exactos,
              (2) mayor cantidad de ganadores correctos, y (3) sorteo entre los empatados
              en presencia de ambas partes.
            </p>
          </div>
        </Card>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Devoluciones
          </h2>
          <div className="flex items-start gap-3 text-white/80">
            <span className="text-2xl">🔁</span>
            <p className="text-sm">
              No se realizarán devoluciones una vez confirmada la participación,
              salvo que el torneo sea cancelado o suspendido definitivamente por FIFA,
              en cuyo caso se reintegra el 100% de lo abonado.
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Disposiciones generales
          </h2>
          <div className="space-y-3 text-white/70 text-sm">
            <p>• La participación implica la aceptación de estas bases y condiciones en su totalidad.</p>
            <p>• El administrador se reserva el derecho de descalificar a cualquier participante que intente manipular el sistema o utilizar medios fraudulentos.</p>
            <p>• En la fase de grupos se utiliza el resultado de los 90 minutos. En la fase eliminatoria se utiliza el resultado al final del tiempo suplementario (prórroga incluida). La definición por penales NO se considera: un partido resuelto por penales se computa según el marcador con el que terminó (es decir, como empate).</p>
            <p>• Las predicciones se cierran automáticamente 10 minutos antes del inicio de cada partido y no pueden modificarse una vez bloqueadas.</p>
            <p>• Ante cualquier situación no prevista en estas bases, la decisión del administrador es definitiva e inapelable.</p>
          </div>
        </Card>

        {/* Disclaimer */}
        <div className="mt-8 px-2 pb-4">
          <p className="text-white/30 text-xs leading-relaxed">
            <span className="font-semibold text-white/40">Aviso legal.</span>{' '}
            Esta actividad es una competencia privada, de carácter recreativo y sin fines de lucro para el organizador,
            llevada a cabo exclusivamente entre personas adultas que participan de forma libre y voluntaria.
            El organizador actúa únicamente como administrador de la plataforma y no retiene ninguna parte del pozo recaudado.
            La presente actividad no constituye un juego de azar de carácter comercial ni se encuentra comprendida
            en las actividades reguladas por organismos de juego de la República Argentina.
            El organizador no se responsabiliza por el uso que los participantes hagan de la plataforma,
            ni por decisiones de terceros (FIFA, federaciones, árbitros) que afecten los resultados.
            Al participar, cada persona declara ser mayor de 18 años, actuar bajo su propia voluntad
            y exime al organizador de toda responsabilidad civil, penal o de cualquier otra índole
            derivada de su participación en esta competencia.
          </p>
        </div>
      </div>
    </AppLayout>
  );
};
