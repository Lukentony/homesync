// Task detail sheet — editable, with history timeline

function TaskDetailSheet({ task, open, onClose, onSave, onDelete, onComplete, onUncomplete, rooms, completed, scoring }) {
const [draft, setDraft] = React.useState(task || null);
const [selectedRoomIds, setSelectedRoomIds] = React.useState([]);
const [selectedDays, setSelectedDays] = React.useState([]);
const [repeatTab, setRepeatTab] = React.useState('none');

const allRooms = rooms || MOCK.rooms;

React.useEffect(() => {
  if (task) {
    setDraft(task);
    var initialRoomIds = task.roomIds ? [...task.roomIds] : (task.roomId ? [task.roomId] : [1]);
    var initialDays = [];
    if (task.tags) {
      try {
        var parsed = typeof task.tags === 'string' ? JSON.parse(task.tags) : task.tags;
        if (Array.isArray(parsed)) {
          parsed.forEach(function(tag) {
            if (String(tag).startsWith('day:')) {
              var dayVal = parseInt(String(tag).replace('day:', ''), 10);
              if (!isNaN(dayVal) && !initialDays.includes(dayVal)) {
                initialDays.push(dayVal);
              }
            } else if (String(tag).startsWith('room:')) {
              var rid = parseInt(String(tag).replace('room:', ''), 10);
              if (!isNaN(rid) && !initialRoomIds.includes(rid)) {
                initialRoomIds.push(rid);
              }
            }
          });
        }
      } catch(e) {}
    }
    if (initialRoomIds.length === 0 && task.roomId) {
      initialRoomIds = [task.roomId];
    }
    setSelectedRoomIds(initialRoomIds);
    setSelectedDays(initialDays);
    
    if (initialDays.length > 0) {
      setRepeatTab('weekly');
    } else if ((task.everyDays || task.frequency_days || 0) > 0) {
      setRepeatTab('days');
    } else {
      setRepeatTab('none');
    }
  }
}, [task]);

if (!open || !draft) return null;

const update = (k, v) => setDraft(d => ({ ...d, [k]: v }));

const syncDraft = (roomIds, days, tab, everyDaysVal) => {
  var otherTags = [];
  if (draft.tags) {
    try {
      var parsed = typeof draft.tags === 'string' ? JSON.parse(draft.tags) : draft.tags;
      if (Array.isArray(parsed)) {
        otherTags = parsed.filter(t => !String(t).startsWith('room:') && !String(t).startsWith('day:'));
      }
    } catch(e) {}
  }
  
  var nextTags = [];
  roomIds.forEach(id => nextTags.push('room:' + id));
  
  var finalEveryDays = 0;
  if (tab === 'weekly') {
    days.forEach(d => nextTags.push('day:' + d));
    finalEveryDays = 7;
  } else if (tab === 'days') {
    finalEveryDays = everyDaysVal || 1;
  }
  
  otherTags.forEach(t => nextTags.push(t));
  
  var roomKeys = roomIds.map(rid => {
    var r = allRooms.find(rm => rm.id === rid || rm._backendId === rid);
    return r ? (r.name||'').toLowerCase().replace(/[^a-z0-9]/g,'_') : null;
  }).filter(Boolean);
  
  var mainRoom = allRooms.find(r => r.id === roomIds[0] || r._backendId === roomIds[0]);
  
  setDraft(d => ({
    ...d,
    roomIds: roomIds,
    roomId: roomIds[0] || 1,
    rooms: roomKeys,
    room: mainRoom ? mainRoom.name?.toLowerCase() : '',
    everyDays: finalEveryDays,
    tags: JSON.stringify(nextTags)
  }));
};

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
  syncDraft(nextIds, selectedDays, repeatTab, draft.everyDays);
};

const handleTabChange = (tab) => {
  setRepeatTab(tab);
  var nextDays = tab === 'weekly' ? (selectedDays.length > 0 ? selectedDays : [1]) : [];
  if (tab === 'weekly') {
    setSelectedDays(nextDays);
  }
  syncDraft(selectedRoomIds, nextDays, tab, tab === 'days' ? (draft.everyDays > 0 && draft.everyDays !== 7 ? draft.everyDays : 1) : 0);
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
  syncDraft(selectedRoomIds, nextDays, repeatTab, draft.everyDays);
};

const handleEveryDaysChange = (val) => {
  syncDraft(selectedRoomIds, selectedDays, repeatTab, val);
};

const assignee = draft.assignee === 'both' ? null : MOCK.users.find(u => u.id === draft.assignee);
const room = allRooms.find(r => r.id === draft.room);
const isCompleted = !!draft.completed;

const relTime = (ts) => {
if (!ts) return '';
const diff = Date.now() - ts;
const m = Math.floor(diff / 60000);
if (m < 1) return 'ora';
if (m < 60) return `${m} min fa`;
const h = Math.floor(m / 60);
if (h < 24) return `${h}h fa`;
const d = Math.floor(h / 24);
return `${d}g fa`;
};
const realHistory = (completed || [])
.filter(t => t.id === draft.id)
.sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))
.slice(0, 5);

return (
<div style={{
position: 'absolute', inset: 0, zIndex: 45,
background: 'rgba(42,29,20,0.42)', backdropFilter: 'blur(2px)',
display: 'flex', alignItems: 'flex-end',
animation: 'hs-fade 200ms ease',
}} onClick={onClose}>
<div onClick={(e) => e.stopPropagation()}
role="dialog" aria-modal="true"
style={{
background: HS.bg, width: '100%',
borderTopLeftRadius: 30, borderTopRightRadius: 30,
padding: `14px 20px calc(env(safe-area-inset-bottom, 0px) + 16px)`,
maxHeight: '92%', overflow: 'auto',
animation: 'hs-slide-up 260ms cubic-bezier(.2,.9,.3,1)',
}}>
<div style={{ width: 40, height: 4, borderRadius: 2, background: HS.hairline, margin: '0 auto 14px' }} />

<input
value={draft.name}
onChange={(e) => update('name', e.target.value)}
style={{
width: '100%', border: 'none', background: 'transparent', outline: 'none',
fontFamily: HS.fontDisplay, fontSize: 28, fontWeight: 500, color: HS.ink, letterSpacing: -0.7,
padding: '4px 0', marginBottom: 10,
}}
/>

{isCompleted ? (
<button
onClick={() => onUncomplete && onUncomplete(draft)}
style={{
width: '100%', border: `1.5px solid ${HS.soonInk}33`, cursor: 'pointer',
padding: '14px', borderRadius: HS.r.md,
background: HS.soonSoft, color: HS.soonInk,
fontFamily: HS.fontUI, fontSize: 14, fontWeight: 700,
display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
marginBottom: 18,
}}>
<Icon name="history" size={18} color={HS.soonInk} strokeWidth={2.4} />
Ripristina task
</button>
) : (
<button
onClick={() => onComplete && onComplete(draft)}
style={{
width: '100%', border: 'none', cursor: 'pointer',
padding: '16px', borderRadius: HS.r.md,
background: HS.sage, color: '#fff', boxShadow: HS.shadow.pop,
fontFamily: HS.fontUI, fontSize: 15, fontWeight: 700,
display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
marginBottom: 18,
}}>
<Icon name="check" size={20} color="#fff" strokeWidth={3} /> Segna come fatto
</button>
)}

<label style={{ fontSize: 11, color: HS.ink3, fontFamily: HS.fontUI, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>Scadenza</label>
<div style={{ display: 'flex', gap: 6, marginTop: 6, marginBottom: 8, flexWrap: 'wrap' }}>
{['ieri', 'oggi', 'domani', 'tra 2g', 'tra 5g', 'tra 7g'].map(d => {
const nd = window.dueStringToDate ? window.dueStringToDate(d) : null;
const isActive = draft.next_due_date ? draft.next_due_date === nd : draft.due === d;
return (
<button key={d} onClick={() => { update('due', d); if (nd) update('next_due_date', nd); }} style={{
border: 'none', padding: '8px 12px', borderRadius: 999, cursor: 'pointer',
fontFamily: HS.fontUI, fontSize: 12.5, fontWeight: 600,
background: isActive ? HS.primary : HS.card,
color: isActive ? '#fff' : HS.ink,
boxShadow: HS.shadow.card,
}}>{d}</button>
);
})}
</div>
<input type="date" value={draft.next_due_date || ''} onChange={(e) => {
const ds = e.target.value;
update('next_due_date', ds);
const diff = ds ? Math.round((new Date(ds+'T00:00:00') - new Date(new Date().toDateString())) / 86400000) : 0;
update('due', diff < 0 ? 'ieri' : diff === 0 ? 'oggi' : diff === 1 ? 'domani' : 'tra ' + diff + 'g');
}} style={{
width: '100%', boxSizing: 'border-box', padding: '10px 14px', marginBottom: 14,
border: 'none', background: HS.card, borderRadius: HS.r.md,
boxShadow: HS.shadow.card, fontFamily: HS.fontUI, fontSize: 14, color: HS.ink, outline: 'none',
}} />

<label style={{ fontSize: 11, color: HS.ink3, fontFamily: HS.fontUI, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>Stanze</label>
<div style={{ display: 'flex', gap: 6, marginTop: 6, marginBottom: 14, flexWrap: 'wrap' }}>
{allRooms.map(r => {
  var isSel = selectedRoomIds.includes(r._backendId || r.id);
  return (
    <button key={r.id} onClick={() => handleToggleRoom(r._backendId || r.id)} style={{
      border: 'none', padding: '8px 12px', borderRadius: 999, cursor: 'pointer',
      fontFamily: HS.fontUI, fontSize: 12.5, fontWeight: 600,
      background: isSel ? r.color : HS.card,
      color: isSel ? '#fff' : HS.ink,
      boxShadow: HS.shadow.card,
      transition: 'all 0.15s ease',
    }}>{r.name}</button>
  );
})}
</div>

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
      value={draft.everyDays > 0 && draft.everyDays !== 7 ? draft.everyDays : 1}
      onChange={(e) => {
        var v = parseInt(e.target.value) || 1;
        handleEveryDaysChange(v);
      }}
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

<label style={{ fontSize: 11, color: HS.ink3, fontFamily: HS.fontUI, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>Assegnato a</label>
<div style={{ display: 'flex', gap: 8, marginTop: 6, marginBottom: 18 }}>
{MOCK.users.map(u => (
<button key={u.id} onClick={() => update('assignee', u.id)} style={{
flex: 1, border: 'none', cursor: 'pointer',
display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
padding: '12px 10px', borderRadius: HS.r.md,
background: draft.assignee === u.id ? u.color : HS.card,
color: draft.assignee === u.id ? '#fff' : HS.ink,
boxShadow: HS.shadow.card,
fontFamily: HS.fontUI, fontWeight: 600, fontSize: 13.5,
}}>
<Avatar user={u} size={24} />{u.name}
</button>
))}
<button onClick={() => update('assignee', 'both')} style={{
flex: 1, border: 'none', cursor: 'pointer',
display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
padding: '12px 10px', borderRadius: HS.r.md,
background: draft.assignee === 'both' ? HS.primary : HS.card,
color: draft.assignee === 'both' ? '#fff' : HS.ink,
boxShadow: HS.shadow.card,
fontFamily: HS.fontUI, fontWeight: 600, fontSize: 13.5,
}}>
<BothAvatar users={MOCK.users} size={22} />Entrambi
</button>
</div>

<label style={{ fontSize: 11, color: HS.ink3, fontFamily: HS.fontUI, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>Difficoltà / Punti</label>
<div style={{ display: 'flex', gap: 8, marginTop: 6, marginBottom: 12 }}>
  {[
    { value: 1, label: 'Facile' },
    { value: 2, label: 'Medio' },
    { value: 3, label: 'Difficile' }
  ].map(d => {
    const pts = d.value * (scoring?.base || 10);
    const currentDiff = Math.min(3, Math.max(1, draft.difficulty || Math.round((draft.points || 0) / (scoring?.base || 3)) || 2));
    const isActive = currentDiff === d.value;
    return (
      <button key={d.value} onClick={() => {
        setDraft(prev => ({
          ...prev,
          difficulty: d.value,
          points: d.value * (scoring?.base || 10)
        }));
      }} style={{
        flex: 1, border: 'none', cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
        padding: '10px 8px', borderRadius: HS.r.md,
        background: isActive ? HS.primary : HS.card,
        color: isActive ? '#fff' : HS.ink,
        boxShadow: HS.shadow.card,
        fontFamily: HS.fontUI, fontWeight: 600, fontSize: 13,
      }}>
        <span>{d.label}</span>
        <span style={{ fontSize: 10, opacity: isActive ? 0.9 : 0.6, fontWeight: 700 }}>+{pts} pt</span>
      </button>
    );
  })}
</div>
<div style={{ fontFamily: HS.fontUI, fontSize: 11, color: HS.ink3, marginTop: -6, marginBottom: 18, lineHeight: 1.4 }}>
  I punti del compito sono determinati dalla difficoltà scelta moltiplicata per i punti base configurati nelle impostazioni ({scoring?.base || 3} pt).
</div>

<label style={{ fontSize: 11, color: HS.ink3, fontFamily: HS.fontUI, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>Storico</label>
<div style={{ marginTop: 8, background: HS.card, borderRadius: HS.r.lg, boxShadow: HS.shadow.card, overflow: 'hidden' }}>
{realHistory.length === 0 && (
<div style={{ padding: '14px', textAlign: 'center', fontFamily: HS.fontUI, fontSize: 12.5, color: HS.ink3 }}>
Nessun completamento precedente
</div>
)}
{realHistory.map((h, i) => {
const isBoth = h.completedBy === 'both';
const u = isBoth ? null : MOCK.users.find(x => x.id === h.completedBy);
return (
<div key={h.id + (h.completedAt || i)} style={{
display: 'flex', alignItems: 'center', gap: 10,
padding: '12px 14px',
borderBottom: i < realHistory.length - 1 ? `1px solid ${HS.hairline}` : 'none',
}}>
{isBoth ? <BothAvatar users={MOCK.users} size={26} /> : <Avatar user={u} size={28} />}
<div style={{ flex: 1 }}>
<div style={{ fontFamily: HS.fontUI, fontSize: 13, fontWeight: 600, color: HS.ink }}>{isBoth ? 'Insieme' : u?.name}</div>
<div style={{ fontFamily: HS.fontUI, fontSize: 11, color: HS.ink3 }}>{relTime(h.completedAt)}</div>
</div>
</div>
);
})}
</div>

<div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
<button onClick={() => { onSave && onSave(draft); onClose(); }} style={{
flex: 1, border: 'none', cursor: 'pointer', padding: '14px',
borderRadius: HS.r.md, background: HS.ink, color: '#fff',
fontFamily: HS.fontUI, fontSize: 14, fontWeight: 700,
}}>Salva modifiche</button>
<button onClick={() => onDelete && onDelete(draft)} style={{
border: 'none', cursor: 'pointer', padding: '14px 16px',
borderRadius: HS.r.md, background: HS.urgentSoft, color: HS.urgentInk,
fontFamily: HS.fontUI, fontSize: 14, fontWeight: 700,
display: 'flex', alignItems: 'center', gap: 6,
}}>
<Icon name="trash" size={16} color={HS.urgentInk} strokeWidth={2.2} />
</button>
</div>
</div>
</div>
);
}

function MetaTile({ icon, label, value, color }) {
return (
<div style={{ background: HS.card, borderRadius: HS.r.md, padding: '12px 14px', boxShadow: HS.shadow.card }}>
<div style={{ display: 'flex', alignItems: 'center', gap: 6, color: HS.ink3 }}>
<Icon name={icon} size={13} color={color || HS.ink3} strokeWidth={2.2} />
<span style={{ fontFamily: HS.fontUI, fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</span>
</div>
<div style={{ marginTop: 2, fontFamily: HS.fontUI, fontSize: 14.5, fontWeight: 600, color: HS.ink }}>{value}</div>
</div>
);
}

window.TaskDetailSheet = TaskDetailSheet;
