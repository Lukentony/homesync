// HomeSync — UserPicker
// Sceglie chi sei (Utente A / Utente B) la prima volta. Salva in localStorage e
// riapplica gli header X-User-Id automaticamente in HS_API.
// Nessuna modifica al prototipo: questo overlay si auto-apre solo se
// localStorage['hs-me-id'] è vuoto.

(function () {
  'use strict';

  // DISATTIVATO: la scelta utente + login e' gestita dal LoginScreen React
  // (unica fonte, basata su session_token). Questo overlay legacy impostava
  // solo hs-me-id senza token -> stato incoerente. Lo lasciamo come no-op.
  return;

})();