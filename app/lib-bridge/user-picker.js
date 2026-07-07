// HomeSync — UserPicker
// Sceglie chi sei la prima volta. Salva in localStorage e
// riapplica gli header X-User-Id automaticamente in HS_API.
// Nessuna modifica al prototipo: questo overlay si auto-apre solo se
// localStorage['hs-me-id'] è vuoto.

(function () {
  'use strict';

  // DISATTIVATO: la scelta utente + login e' gestita dal LoginScreen React
  // (unica fonte, basata su session_token). Questo overlay legacy impostava
  // solo hs-me-id senza token -> stato incoerente. Lo lasciamo come no-op.
  return;

  if (localStorage.getItem('hs-me-id')) return;

  function pick(id) {
    localStorage.setItem('hs-me-id', String(id));
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 300);
  }

  const cfg = window.HS_CFG || {};
  const users = cfg.users || [
    { id: 1, name: 'Utente A', emoji: '🦊', color: '#E2743A' },
    { id: 2, name: 'Utente B', emoji: '🐻', color: '#6F9E7A' },
  ];

  const overlay = document.createElement('div');
  overlay.id = 'hs-user-picker';
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 100000;
    background: radial-gradient(ellipse at center, #241a13 0%, #120d09 100%);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Inter', system-ui; color: #FBF6EE;
    transition: opacity 0.3s;
  `;

  overlay.innerHTML = `
    <div style="max-width: 360px; width: calc(100% - 40px); text-align: center;">
      <div style="font-family: 'Fraunces', Georgia, serif; font-size: 38px; font-weight: 500; letter-spacing: -1px; margin-bottom: 6px;">HomeSync</div>
      <div style="font-size: 14px; color: rgba(251,246,238,0.65); margin-bottom: 32px;">Chi sei?</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
        ${users.map(u => `
          <button data-uid="${u.id}" style="
            border: none; cursor: pointer; padding: 26px 18px;
            background: rgba(255,255,255,0.04); border-radius: 22px;
            color: #FBF6EE; font-family: inherit;
            transition: transform 0.15s, background 0.15s;
            display: flex; flex-direction: column; align-items: center; gap: 12px;
          " onmouseover="this.style.background='rgba(255,255,255,0.10)'; this.style.transform='translateY(-2px)'"
             onmouseout="this.style.background='rgba(255,255,255,0.04)'; this.style.transform='translateY(0)'">
            <div style="width: 64px; height: 64px; border-radius: 50%; background: ${u.color}; display: flex; align-items: center; justify-content: center; font-size: 32px;">${u.emoji || '👤'}</div>
            <div style="font-size: 17px; font-weight: 600;">${u.name}</div>
          </button>
        `).join('')}
      </div>
      <div style="margin-top: 24px; font-size: 11.5px; color: rgba(251,246,238,0.4);">Potrai cambiarlo dalle impostazioni.</div>
    </div>
  `;

  function ready() {
    document.body.appendChild(overlay);
    overlay.querySelectorAll('button[data-uid]').forEach(b => {
      b.addEventListener('click', () => pick(parseInt(b.dataset.uid, 10)));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ready);
  } else {
    ready();
  }
})();
