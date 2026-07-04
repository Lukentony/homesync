// Slide-in drawer menu from the top-right (header menu button).

function DrawerMenu({ open, onClose, onNavigate, activeTab, vacation, setVacation }) {
if (!open) return null;

const items = [
{ id: 'today', label: 'Oggi', icon: 'home', sub: 'Task del giorno' },
{ id: 'rooms', label: 'Stanze', icon: 'layers', sub: 'Pulizia per ambiente' },
{ id: 'calendar', label: 'Calendario', icon: 'calendar', sub: 'Vista mensile' },
{ id: 'score', label: 'Punteggi', icon: 'trophy', sub: 'Statistiche e storico' },
{ id: 'history', label: 'Storico', icon: 'history', sub: 'Tutto ciò che è stato fatto' },
{ id: 'settings', label: 'Impostazioni', icon: 'settings', sub: 'Stanze, regole, membri' },
];

const meId = parseInt(localStorage.getItem('hs-me-id') || '1');
const userMe = MOCK.users.find(u => u.id === meId) || MOCK.users[0];

return (
<div style={{
position: 'absolute', inset: 0, zIndex: 55,
background: 'rgba(42,29,20,0.42)', backdropFilter: 'blur(3px)',
animation: 'hs-fade 180ms ease',
}} onClick={onClose}>
<div onClick={(e) => e.stopPropagation()} style={{
position: 'absolute', top: 0, right: 0, bottom: 0,
width: '84%', maxWidth: 340, background: HS.bg,
boxShadow: '-10px 0 40px rgba(42,29,20,0.25)',
animation: 'hs-drawer-in 280ms cubic-bezier(.2,.9,.3,1)',
display: 'flex', flexDirection: 'column',
paddingTop: 52,
}}>
<div style={{ padding: '4px 18px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
<Avatar user={userMe} size={44} ring />
<div style={{ flex: 1 }}>
<div style={{ fontFamily: HS.fontDisplay, fontSize: 20, color: HS.ink, fontWeight: 500, letterSpacing: -0.4, lineHeight: 1 }}>
{`Casa di ${MOCK.users.map(u => u.name).join(' e ')}`}
</div>
<div style={{ fontFamily: HS.fontUI, fontSize: 12, color: HS.ink3, marginTop: 3 }}>
{MOCK.users.length} membri · {MOCK.rooms.length} stanze
</div>
</div>
<button onClick={onClose} style={{
border: 'none', background: HS.bgSunken, borderRadius: 10, padding: 8, cursor: 'pointer',
}}><Icon name="x" size={18} color={HS.ink2} /></button>
</div>

<div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
{items.map(it => {
const active = it.id === activeTab;
return (
<button key={it.id} onClick={() => { onNavigate(it.id); onClose(); }} style={{
width: '100%', border: 'none', cursor: 'pointer',
display: 'flex', alignItems: 'center', gap: 14,
padding: '12px 12px', borderRadius: HS.r.md,
background: active ? HS.primarySoft : 'transparent',
marginBottom: 4, textAlign: 'left',
}}>
<div style={{
width: 38, height: 38, borderRadius: 10,
background: active ? HS.primary : HS.card,
color: active ? '#fff' : HS.ink2,
display: 'flex', alignItems: 'center', justifyContent: 'center',
boxShadow: active ? 'none' : HS.shadow.card,
}}>
<Icon name={it.icon} size={18} color={active ? '#fff' : HS.ink2} strokeWidth={2.1} />
</div>
<div style={{ flex: 1 }}>
<div style={{
fontFamily: HS.fontUI, fontSize: 14.5, fontWeight: 600,
color: active ? HS.primaryInk : HS.ink,
}}>{it.label}</div>
<div style={{ fontFamily: HS.fontUI, fontSize: 11.5, color: HS.ink3, marginTop: 1 }}>{it.sub}</div>
</div>
{active && <Icon name="chevron" size={16} color={HS.primaryInk} />}
</button>
);
})}
</div>

<div style={{ padding: 18, borderTop: `1px solid ${HS.hairline}` }}>
<button
  onClick={() => {
    if (window.HS_API && window.HS_API.logout) {
      window.HS_API.logout().then(() => {
        window.location.reload();
      });
    }
  }}
  style={{
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    padding: '14px 16px', borderRadius: HS.r.md, border: `1px solid ${HS.hairline}`,
    background: '#FFEAEA', color: '#D94B4B', fontFamily: HS.fontUI, fontSize: 14, fontWeight: 700,
    cursor: 'pointer'
  }}
>
  <Icon name="logout" size={16} color="#D94B4B" />
  Esci dal profilo
</button>
</div>

</div>
</div>
);
}

window.DrawerMenu = DrawerMenu;
