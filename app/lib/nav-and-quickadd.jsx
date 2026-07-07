// Bottom tab bar + floating center add button + quick-add sheet

const TABS = [
{ id: 'today', label: 'Oggi', icon: 'home' },
{ id: 'rooms', label: 'Stanze', icon: 'layers' },
{ id: 'calendar', label: 'Calendario', icon: 'calendar' },
{ id: 'score', label: 'Punteggi', icon: 'trophy' },
];

function BottomTabBar({ active, onChange, onAdd }) {
return (
<div style={{
position: 'absolute', bottom: 0, left: 0, right: 0,
padding: `8px 10px calc(env(safe-area-inset-bottom, 0px) + 10px)`,
background: 'rgba(251,246,238,0.94)',
backdropFilter: 'blur(14px) saturate(180%)',
WebkitBackdropFilter: 'blur(14px) saturate(180%)',
borderTop: `1px solid ${HS.hairline}`,
display: 'flex', alignItems: 'center', justifyContent: 'space-around',
zIndex: 30,
}}>
{TABS.slice(0, 2).map(t => <TabBtn key={t.id} tab={t} active={active === t.id} onClick={() => onChange(t.id)} />)}
<button
onClick={onAdd}
aria-label="Aggiungi nuovo task"
style={{
width: 56, height: 56, borderRadius: '50%',
background: HS.primary, border: 'none',
boxShadow: HS.shadow.fab, cursor: 'pointer',
display: 'flex', alignItems: 'center', justifyContent: 'center',
transform: 'translateY(-12px)',
transition: 'transform .15s ease, box-shadow .15s ease',
}}
onMouseDown={(e) => { e.currentTarget.style.transform = 'translateY(-12px) scale(0.92)'; e.currentTarget.style.boxShadow = HS.shadow.card; }}
onMouseUp={(e) => { e.currentTarget.style.transform = 'translateY(-12px)'; e.currentTarget.style.boxShadow = HS.shadow.fab; }}
onTouchStart={(e) => { e.currentTarget.style.transform = 'translateY(-12px) scale(0.92)'; }}
onTouchEnd={(e) => { e.currentTarget.style.transform = 'translateY(-12px)'; }}
>
<Icon name="plus" size={28} color="#fff" strokeWidth={3} />
</button>
{TABS.slice(2).map(t => <TabBtn key={t.id} tab={t} active={active === t.id} onClick={() => onChange(t.id)} />)}
</div>
);
}

function TabBtn({ tab, active, onClick }) {
return (
<button
onClick={onClick}
aria-label={tab.label}
aria-current={active ? 'page' : undefined}
style={{
flex: 1, border: 'none', background: 'transparent',
display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
padding: '6px 0', cursor: 'pointer',
color: active ? HS.primary : HS.ink3,
}}
>
<Icon name={tab.icon} size={22} strokeWidth={active ? 2.4 : 2} />
<span style={{
fontSize: 10, fontWeight: active ? 700 : 500,
fontFamily: HS.fontUI, letterSpacing: 0.1,
}}>{tab.label}</span>
</button>
);
}

function QuickAddSheet({ open, onClose, onCreate, onComplete, rooms, scoring }) {
const allRooms = rooms || MOCK.rooms;
const [step, setStep] = React.useState('pick');
const [name, setName] = React.useState('');
const [selectedRoomIds, setSelectedRoomIds] = React.useState([]);
const [repeatTab, setRepeatTab] = React.useState('none');
const [selectedDays, setSelectedDays] = React.useState([]);
const [customEvery, setCustomEvery] = React.useState(1);
const [assignee, setAssignee] = React.useState((MOCK.users[0] || {}).id || 'both');
const [difficulty, setDifficulty] = React.useState(2);
const todayStr = new Date().toISOString().slice(0,10);
const [dueDate, setDueDate] = React.useState(todayStr);
const [quickActions, setQuickActions] = React.useState([]);

React.useEffect(() => {
  if (open) {
    setSelectedRoomIds([allRooms[0]?.id || allRooms[0]?._backendId || 1]);
    setRepeatTab('none');
    setDifficulty(2);
    setSelectedDays([]);
    setCustomEvery(1);
    
    // Carica le creazioni rapide dal backend
    if (window.HS_API && window.HS_API.getQuickActions) {
      window.HS_API.getQuickActions()
        .then(res => setQuickActions(res))
        .catch(err => console.error("Error loading quick actions:", err));
    }
  } else {
    setStep('pick');
    setName('');
    setDueDate(todayStr);
  }
}, [open, allRooms]);

const handleToggleRoom = (rId) => {
  var nextIds = [...selectedRoomIds];
  var idx = nextIds.indexOf(rId);
  if (idx > -1) {
    if (nextIds.length > 1) {
      nextIds.splice(idx, 1);
    }
  } else {
    nextIds.push(rId);
  }
  setSelectedRoomIds(nextIds);
};

const handleTabChange = (tab) => {
  setRepeatTab(tab);
  if (tab === 'weekly' && selectedDays.length === 0) {
    setSelectedDays([1]); // default to Monday
  }
};

const handleToggleDay = (dayNum) => {
  var nextDays = [...selectedDays];
  var idx = nextDays.indexOf(dayNum);
  if (idx > -1) {
    nextDays.splice(idx, 1);
  } else {
    nextDays.push(dayNum);
  }
  setSelectedDays(nextDays);
};

const handleCreateCustom = () => {
  if (!name.trim()) return;
  
  var finalEvery = 0;
  var tagsList = [];
  
  selectedRoomIds.forEach(rid => {
    tagsList.push('room:' + rid);
  });
  
  const isQa = (repeatTab === 'none');
  
  if (repeatTab === 'weekly') {
    finalEvery = 7;
    selectedDays.forEach(d => {
      tagsList.push('day:' + d);
    });
  } else if (repeatTab === 'days') {
    finalEvery = customEvery || 1;
  } else {
    finalEvery = 9999;
  }
  
  onCreate({
    name: name,
    roomId: selectedRoomIds[0] || 1,
    every: finalEvery,
    assignee: assignee,
    difficulty: difficulty,
    initial_due_date: isQa ? '9999-12-31' : dueDate,
    is_quick_action: isQa,
    tags: JSON.stringify(tagsList)
  });
};

if (!open) return null;

// Estrae emoji se il nome inizia con una emoji
function getEmoji(str) {
  const match = String(str).match(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF]|\uD83D[\uDE00-\uDE4F]|\uD83E[\uDD00-\uDFFF])/);
  return match ? match[1] : '⚡';
}

return (
<div style={{
position: 'fixed', inset: 0, zIndex: 40,
background: 'rgba(42,29,20,0.42)',
backdropFilter: 'blur(2px)',
display: 'flex', alignItems: 'flex-end',
animation: 'hs-fade 200ms ease',
}} onClick={onClose}>
<div
onClick={(e) => e.stopPropagation()}
role="dialog"
aria-modal="true"
aria-label="Aggiungi task"
style={{
background: HS.bg, width: '100%',
borderTopLeftRadius: 30, borderTopRightRadius: 30,
padding: `14px 20px calc(env(safe-area-inset-bottom, 0px) + 20px)`,
maxHeight: '88%', overflow: 'auto',
animation: 'hs-slide-up 260ms cubic-bezier(.2,.9,.3,1)',
}}
>
<div style={{ width: 40, height: 4, borderRadius: 2, background: HS.hairline, margin: '0 auto 14px' }} />

{step === 'pick' && (
<>
<h2 style={{
margin: '0 0 4px', fontFamily: HS.fontDisplay, fontWeight: 500,
fontSize: 28, color: HS.ink, letterSpacing: -0.5,
}}>Creazioni Rapide</h2>
<p style={{ margin: '0 0 16px', fontSize: 13.5, color: HS.ink2, fontFamily: HS.fontUI }}>
Esegui all'istante una delle creazioni rapide attive o creane una personalizzata.
</p>
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
{quickActions.map(qa => {
  const emoji = getEmoji(qa.name);
  const cleanName = qa.name.replace(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF]|\uD83D[\uDE00-\uDE4F]|\uD83E[\uDD00-\uDFFF])\s*/, '');
  return (
    <button key={qa.id}
    onClick={() => {
      if (onComplete) {
        // 'both' fa scattare in handleComplete la scelta "Chi l'ha fatto?"
        // (self/altro/insieme), invece di assegnare sempre e solo a se
        // stessi senza possibilita' di scelta. qa arriva da
        // getQuickActions() (TaskRead grezzo, senza 'points' calcolato
        // lato frontend) — serve per la preview punti nel picker
        // "Chi l'ha fatto?", altrimenti sarebbe NaN.
        onComplete({ ...qa, assignee: 'both', points: (qa.difficulty || 2) * ((scoring || {}).base || 3) });
      }
      onClose();
    }}
    style={{
    border: 'none', background: HS.card,
    borderRadius: HS.r.lg, padding: '14px 12px',
    boxShadow: HS.shadow.card, cursor: 'pointer',
    display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6,
    textAlign: 'left',
    }}>
    <div style={{
    width: 36, height: 36, borderRadius: 10,
    background: HS.bgSunken, fontSize: 20,
    display: 'flex', alignItems: 'center', justifycontent: 'center',
    }}>{emoji}</div>
    <div style={{ fontFamily: HS.fontUI, fontSize: 13.5, fontWeight: 600, color: HS.ink, lineHeight: 1.25 }}>{cleanName}</div>
    <div style={{ fontFamily: HS.fontUI, fontSize: 11, color: HS.sageInk }}>
    +{(qa.difficulty || 2) * ((scoring || {}).base || 3)} punti
    </div>
    </button>
  );
})}
</div>
<button onClick={() => setStep('custom')}
style={{
width: '100%', border: `1.5px dashed ${HS.hairline}`,
background: 'transparent', borderRadius: HS.r.lg,
padding: '14px', fontFamily: HS.fontUI, fontSize: 14, fontWeight: 600,
color: HS.ink2, cursor: 'pointer',
display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
}}>
<Icon name="edit" size={18} color={HS.ink2} /> Crea personalizzato
</button>
</>
)}

{step === 'custom' && (
<>
<div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
<button onClick={() => setStep('pick')} style={{
border: 'none', background: HS.bgSunken, borderRadius: 10, padding: 8, cursor: 'pointer',
}}><Icon name="chevronL" size={18} color={HS.ink} /></button>
<h2 style={{
margin: 0, fontFamily: HS.fontDisplay, fontWeight: 500,
fontSize: 26, color: HS.ink, letterSpacing: -0.5,
}}>Personalizza</h2>
</div>
<label style={{ fontSize: 11, color: HS.ink3, fontFamily: HS.fontUI, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>Nome</label>
<input value={name} onChange={(e) => setName(e.target.value)} placeholder="es. Pulire il forno"
style={{
width: '100%', boxSizing: 'border-box',
padding: '14px 14px', marginTop: 6, marginBottom: 14,
border: 'none', background: HS.card, borderRadius: HS.r.md,
boxShadow: HS.shadow.card, fontFamily: HS.fontUI, fontSize: 15, color: HS.ink,
outline: 'none',
}} />
<label style={{ fontSize: 11, color: HS.ink3, fontFamily: HS.fontUI, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>Stanze</label>
<div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6, marginBottom: 14 }}>
{allRooms.map(r => {
  var isSel = selectedRoomIds.includes(r.id || r._backendId);
  return (
    <button key={r.id} onClick={() => handleToggleRoom(r.id || r._backendId)} style={{
      border: 'none', padding: '8px 12px', borderRadius: 999, cursor: 'pointer',
      fontFamily: HS.fontUI, fontSize: 13, fontWeight: 600,
      background: isSel ? r.color : HS.card,
      color: isSel ? '#fff' : HS.ink,
      boxShadow: HS.shadow.card,
      transition: 'all 0.15s ease',
    }}>{r.name}</button>
  );
})}
</div>
<label style={{ fontSize: 11, color: HS.ink3, fontFamily: HS.fontUI, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>Inizia il</label>
<input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
style={{ width: '100%', boxSizing: 'border-box', padding: '14px', marginTop: 6, marginBottom: 14,
border: 'none', background: HS.card, borderRadius: HS.r.md,
boxShadow: HS.shadow.card, fontFamily: HS.fontUI, fontSize: 15, color: HS.ink,
outline: 'none' }} />
<label style={{ fontSize: 11, color: HS.ink3, fontFamily: HS.fontUI, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>Ripeti</label>
<div style={{ display: 'flex', background: HS.card, borderRadius: 14, padding: 4, marginTop: 6, marginBottom: 12, boxShadow: HS.shadow.card }}>
  {['none', 'days', 'weekly'].map((t) => {
    var label = t === 'none' ? 'Mai' : t === 'days' ? 'Ogni X giorni' : 'Giorni sett.';
    var active = repeatTab === t;
    return (
      <button
        key={t}
        onClick={() => handleTabChange(t)}
        style={{
          flex: 1, border: 'none', padding: '8px 4px', borderRadius: 10, cursor: 'pointer',
          fontFamily: HS.fontUI, fontSize: 12.5, fontWeight: 700,
          background: active ? HS.ink : 'transparent',
          color: active ? '#fff' : HS.ink2,
          transition: 'all 0.2s ease',
        }}
      >
        {label}
      </button>
    );
  })}
</div>

{repeatTab === 'days' && (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, animation: 'hs-fade 200ms ease' }}>
    <span style={{ fontFamily: HS.fontUI, fontSize: 13, color: HS.ink2 }}>Ripeti ogni:</span>
    <input
      type='number' min='1' max='365'
      value={customEvery}
      onChange={(e) => setCustomEvery(parseInt(e.target.value) || 1)}
      style={{
        width: 60, padding: '8px', border: 'none', borderRadius: 12,
        fontFamily: HS.fontUI, fontSize: 14, fontWeight: 700,
        background: HS.card, boxShadow: HS.shadow.card,
        outline: 'none', textAlign: 'center', color: HS.ink
      }}
    />
    <span style={{ fontFamily: HS.fontUI, fontSize: 13, color: HS.ink2 }}>giorni</span>
  </div>
)}

{repeatTab === 'weekly' && (
  <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap', animation: 'hs-fade 200ms ease' }}>
    {[
      { v: 1, l: 'Lun' },
      { v: 2, l: 'Mar' },
      { v: 3, l: 'Mer' },
      { v: 4, l: 'Gio' },
      { v: 5, l: 'Ven' },
      { v: 6, l: 'Sab' },
      { v: 0, l: 'Dom' }
    ].map((d) => {
      var active = selectedDays.includes(d.v);
      return (
        <button
          key={d.v}
          onClick={() => handleToggleDay(d.v)}
          style={{
            border: 'none', padding: '8px 12px', borderRadius: 12, cursor: 'pointer',
            fontFamily: HS.fontUI, fontSize: 12, fontWeight: 700,
            background: active ? HS.primary : HS.card,
            color: active ? '#fff' : HS.ink,
            boxShadow: HS.shadow.card,
            transition: 'all 0.15s ease',
          }}
        >
          {d.l}
        </button>
      );
    })}
  </div>
)}
<label style={{ fontSize: 11, color: HS.ink3, fontFamily: HS.fontUI, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>Difficolta</label>
<div style={{ display: 'flex', gap: 8, marginTop: 6, marginBottom: 14 }}>
  {[{v:1,l:'Facile'},{v:2,l:'Medio'},{v:3,l:'Difficile'}].map(d => (
    <button key={d.v} onClick={() => setDifficulty(d.v)} style={{
      flex: 1, border: 'none', padding: '10px 6px', borderRadius: 10, cursor: 'pointer',
      background: difficulty === d.v ? HS.ink : HS.card,
      color: difficulty === d.v ? '#fff' : HS.ink2,
      boxShadow: HS.shadow.card,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
    }}>
      <span style={{ fontFamily: HS.fontUI, fontSize: 13, fontWeight: 700 }}>{d.l}</span>
      <span style={{ fontFamily: HS.fontUI, fontSize: 10, opacity: 0.7 }}>{d.v}x base</span>
    </button>
  ))}
</div>
<label style={{ fontSize: 11, color: HS.ink3, fontFamily: HS.fontUI, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>Assegna a</label>
<div style={{ display: 'flex', gap: 8, marginTop: 6, marginBottom: 20 }}>
{MOCK.users.map(u => (
<button key={u.id} onClick={() => setAssignee(u.id)} style={{
flex: 1, border: 'none', cursor: 'pointer',
display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
padding: '12px 10px', borderRadius: HS.r.md,
background: assignee === u.id ? u.color : HS.card,
color: assignee === u.id ? '#fff' : HS.ink,
boxShadow: HS.shadow.card,
fontFamily: HS.fontUI, fontWeight: 600, fontSize: 13.5,
}}>
<Avatar user={u} size={24} />{u.name}
</button>
))}
<button onClick={() => setAssignee('both')} style={{
flex: 1, border: 'none', cursor: 'pointer',
display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
padding: '12px 10px', borderRadius: HS.r.md,
background: assignee === 'both' ? HS.primary : HS.card,
color: assignee === 'both' ? '#fff' : HS.ink,
boxShadow: HS.shadow.card,
fontFamily: HS.fontUI, fontWeight: 600, fontSize: 13.5,
}}>
<BothAvatar users={MOCK.users} size={22} />Entrambi
</button>
</div>
<button
onClick={handleCreateCustom}
disabled={!name.trim()}
style={{
width: '100%', padding: '16px', border: 'none', cursor: name.trim() ? 'pointer' : 'default',
borderRadius: HS.r.md, fontFamily: HS.fontUI, fontSize: 15, fontWeight: 700,
background: name.trim() ? HS.primary : HS.bgSunken,
color: name.trim() ? '#fff' : HS.ink3,
boxShadow: name.trim() ? HS.shadow.fab : 'none',
}}
>Crea task</button>
</>
)}
</div>
</div>
);
}

Object.assign(window, { BottomTabBar, QuickAddSheet, TABS });
