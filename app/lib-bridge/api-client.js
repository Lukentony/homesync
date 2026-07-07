// HomeSync — API client (browser-side)
// Caricato PRIMA di mockdata.jsx. Espone window.HS_API.
// Se runtime-config.json non è raggiungibile o l'API è giù, client API (thin client) (così il prototipo continua a funzionare in dev
// anche senza backend).

(function () {
'use strict';

const DEFAULT_CFG = {
apiBaseUrl: '/api',
appName: 'HomeSync',
users: [
{ id: 1, name: 'Utente A', emoji: '🦦', color: '#E2743A' },
{ id: 2, name: 'Utente B', emoji: '🐢', color: '#6F9E7A' },
],
features: { vacationMode: true, weeklyLeaderboard: true },
};

// Caricamento runtime config (sincrono via XHR per essere disponibile
// prima del primo render React. Bloccante solo all'avvio, ~1ms.)
let cfg = DEFAULT_CFG;
try {
const xhr = new XMLHttpRequest();
xhr.open('GET', '/runtime-config.json', false);
xhr.send(null);
if (xhr.status === 200) {
cfg = Object.assign({}, DEFAULT_CFG, JSON.parse(xhr.responseText));
}
} catch (e) {
console.warn('[HS_API] runtime-config.json non disponibile, uso defaults', e);
}

// Identità utente persistita (selezionata via UserPicker la prima volta)
function getMe() {
const id = localStorage.getItem('hs-me-id');
return id ? parseInt(id, 10) : null;
}
function setMe(id) {
localStorage.setItem('hs-me-id', String(id));
}

function headers(extra = {}) {
  const token = localStorage.getItem('hs-session-token');
  const h = { 'Content-Type': 'application/json', ...extra };
  if (token) h['Authorization'] = 'Bearer ' + token;
  return h;
}

// Re-login senza PIN (uso domestico): ottiene un token per l'identita' salvata.
// Single-flight: le chiamate concorrenti condividono lo stesso login.
let _loginInFlight = null;
function ensureLogin() {
  if (_loginInFlight) return _loginInFlight;
  _loginInFlight = (async () => {
    const id = localStorage.getItem('hs-me-id');
    if (!id) return false;
    try {
      const base = (cfg.apiBaseUrl || '/api').replace(/\/$/, '');
      const lr = await fetch(base + '/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: parseInt(id, 10), pin: '' }),
      });
      if (!lr.ok) return false;
      const d = await lr.json();
      if (d && d.session_token) {
        localStorage.setItem('hs-session-token', d.session_token);
        return true;
      }
    } catch (e) { /* rete giu': gestisce il chiamante */ }
    return false;
  })().finally(() => { _loginInFlight = null; });
  return _loginInFlight;
}

async function req(method, path, body, _retried) {
const url = cfg.apiBaseUrl.replace(/\/$/, '') + path;
const opts = { method, headers: headers() };
if (body !== undefined) opts.body = JSON.stringify(body);
const r = await fetch(url, opts);
// Sessione mancante/scaduta: ri-autentica una volta (senza PIN) e riprova.
if (r.status === 401 && !_retried) {
  if (await ensureLogin()) return req(method, path, body, true);
}
if (!r.ok) {
const txt = await r.text().catch(() => '');
throw new Error(`HTTP ${r.status} ${method} ${path}: ${txt}`);
}
if (r.status === 204) return null;
return r.json();
}

// ---------------------------------------------------------------------------
// API surface
// ---------------------------------------------------------------------------

const HS_API = {
cfg,
getMe,
setMe,

// health
health: () => fetch((cfg.apiBaseUrl || '').replace(/\/api\/?$/, '') + '/health', { headers: headers() }).then(r => r.json()).catch(() => null),

// users
listUsers: () => req('GET', '/users').catch(() => cfg.users || []),
renameUser: (id, name) => req('PATCH', `/users/${id}/name`, { name }),

// rooms
listRooms: () => req('GET', '/rooms'),
createRoom: (payload) => req('POST', '/rooms', payload),
updateRoom: (id, payload) => req('PUT', `/rooms/${id}`, payload),
deleteRoom: (id, force = false) => req('DELETE', `/rooms/${id}${force ? '?force=true' : ''}`),

// tasks
listTasks: () => req('GET', '/tasks/due'),
createTask: (payload) => req('POST', '/tasks', payload),
updateTask: (id, payload, scope = 'all') => req('PUT', `/tasks/${id}?scope=${scope}`, payload),
deleteTask: (id, scope = 'all') => req('DELETE', `/tasks/${id}?scope=${scope}`),
completeTask: (id, payload = {}) => req('POST', `/tasks/${id}/complete`, payload),
undoComplete: (id) => req('DELETE', `/tasks/${id}/complete`),
getQuickActions: () => req('GET', '/tasks/quick-actions'),

// stats
leaderboard: () => req('GET', '/stats/leaderboard'),
  listAll: () => req('GET', '/tasks'),
  resetTest: () => req('POST', '/tasks/reset-test'),
history: (days = 30) => req('GET', `/stats/history?days=${days}`),
deleteHistoryItem: (id) => req('DELETE', `/stats/history/${id}`),

// settings
getSettings: () => req('GET', '/settings'),
setVacation: (active) => req('PATCH', '/settings/vacation', { active }),

// probe
isReachable: async () => {
try {
const r = await fetch('/health', { method: 'GET' });
return r.ok;
} catch { return false; }
},
  // PATCH user emoji/color
  patchUser: (id, data) => req('PATCH', '/users/'+id, data),
  
  // login
  login: (userId, pin) => req('POST', '/users/login', { user_id: userId, pin }).then(r => {
    if (r && r.session_token) {
      localStorage.setItem('hs-session-token', r.session_token);
      localStorage.setItem('hs-me-id', String(r.user_id));
    }
    return r;
  }),
  
  // logout
  logout: () => {
    localStorage.removeItem('hs-session-token');
    localStorage.removeItem('hs-me-id');
    return Promise.resolve();
  },
  
  // scoring base
  getScoringBase: () => req('GET', '/settings/scoring-base'),
  setScoringBase: (base) => req('PATCH', `/settings/scoring-base?base=${base}`),

  // VAPID
  getVapidPublicKey: () => req('GET', '/settings/vapid-public-key'),
};

window.HS_API = HS_API;
window.HS_CFG = cfg;
})();
