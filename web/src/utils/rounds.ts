// Rondas cuyas predicciones ajenas se ven SIEMPRE: fase de grupos y
// dieciseisavos. Cualquier otra ronda (octavos de final en adelante) se oculta
// a terceros hasta que el partido se bloquea.
//
// Contemplamos ambos idiomas a propósito: las dos bases guardan `round`
// distinto — Pago en es-ES ('Primera fase', 'Dieciseisavos de final') y CAME
// en inglés ('First Stage', 'Round of 32'). Con lista blanca, si algún día
// aparece un valor inesperado, se oculta (falla del lado seguro) en vez de
// filtrarse.
const ALWAYS_VISIBLE_ROUNDS = new Set<string>([
  'Primera fase',
  'First Stage',
  'Dieciseisavos de final',
  'Round of 32',
]);

/**
 * ¿Las predicciones de esta ronda deben ocultarse a terceros hasta el cierre?
 * Sólo aplica de octavos de final en adelante (cualquier ronda que no sea
 * fase de grupos ni dieciseisavos).
 */
export const isRestrictedKnockoutRound = (round: string): boolean =>
  !ALWAYS_VISIBLE_ROUNDS.has(round);
