// "Chi l'ha fatto?" picker — asked when completing a task assigned to both.

function WhoDidItSheet({ task, open, onPick, onClose }) {
if (!open || !task) return null;
const [a, b] = MOCK.users;

// task.points è la preview calcolata in loadData() e può essere negativa
// (task in ritardo di più di 1 giorno) -> niente "+" hardcoded, usa fmtPoints.
const fmt = window.fmtPoints || ((n) => (n >= 0 ? '+' : '') + n);
// Quota condivisa: il backend fa ceil(|base|/2) e SOLO DOPO applica il segno
// (calculate_points poi negato in complete_task). Math.ceil(negativo/2) darebbe
// un risultato diverso (es. -3 -> -1 invece di -2) perché arrotonda verso l'alto
// anche sui negativi: replichiamo lo stesso ordine di operazioni del backend.
const sharedPts = task.points < 0
  ? -Math.ceil(Math.abs(task.points) / 2)
  : Math.ceil(task.points / 2);
const choices = [
{ id: a.id, label: a.name, sub: `${fmt(task.points)} pt`, users: [a], color: a.color },
{ id: b.id, label: b.name, sub: `${fmt(task.points)} pt`, users: [b], color: b.color },
{ id: 'both', label: 'Insieme', sub: `${fmt(sharedPts)} pt a testa`, users: [a, b], color: HS.primary },
];

return (
<div style={{
position: 'absolute', inset: 0, zIndex: 50,
background: 'rgba(42,29,20,0.52)', backdropFilter: 'blur(3px)',
display: 'flex', alignItems: 'flex-end',
animation: 'hs-fade 200ms ease',
}} onClick={onClose}>
<div onClick={(e) => e.stopPropagation()}
role="dialog" aria-modal="true" aria-label="Chi ha completato questo task?"
style={{
background: HS.bg, width: '100%',
borderTopLeftRadius: 30, borderTopRightRadius: 30,
padding: `14px 20px calc(env(safe-area-inset-bottom, 0px) + 20px)`,
animation: 'hs-slide-up 260ms cubic-bezier(.2,.9,.3,1)',
}}>
<div style={{ width: 40, height: 4, borderRadius: 2, background: HS.hairline, margin: '0 auto 14px' }} />
<div style={{
fontFamily: HS.fontUI, fontSize: 11, color: HS.primary, fontWeight: 700,
textTransform: 'uppercase', letterSpacing: 1.4,
}}>Task condiviso</div>
<h2 style={{
margin: '4px 0 6px', fontFamily: HS.fontDisplay, fontWeight: 500,
fontSize: 26, color: HS.ink, letterSpacing: -0.5, lineHeight: 1.15,
}}>Chi l'ha fatto?</h2>
<p style={{ margin: '0 0 18px', fontSize: 13.5, color: HS.ink2, fontFamily: HS.fontUI }}>
"{task.name}" era assegnato a entrambi.
</p>
<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
{choices.map(c => (
<button key={c.id} onClick={() => onPick(c.id)} style={{
width: '100%', border: 'none', cursor: 'pointer',
background: HS.card, borderRadius: HS.r.lg, padding: '14px 16px',
boxShadow: HS.shadow.card,
display: 'flex', alignItems: 'center', gap: 14,
position: 'relative', overflow: 'hidden',
}}>
<div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: c.color }} />
{c.users.length === 1
? <Avatar user={c.users[0]} size={40} />
: <BothAvatar users={c.users} size={40} />}
<div style={{ flex: 1, textAlign: 'left' }}>
<div style={{ fontFamily: HS.fontUI, fontSize: 15.5, fontWeight: 700, color: HS.ink }}>{c.label}</div>
<div style={{ fontFamily: HS.fontUI, fontSize: 12, color: HS.ink3, marginTop: 2 }}>{c.sub}</div>
</div>
<Icon name="chevron" size={18} color={HS.ink3} />
</button>
))}
</div>
<button onClick={onClose} style={{
width: '100%', marginTop: 12, border: 'none', background: 'transparent',
padding: '12px', cursor: 'pointer',
fontFamily: HS.fontUI, fontSize: 13.5, fontWeight: 600, color: HS.ink3,
}}>Annulla</button>
</div>
</div>
);
}

window.WhoDidItSheet = WhoDidItSheet;
