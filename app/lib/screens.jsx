// Screens — TodayScreen with 2 layout variants, plus supporting screens

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '30px 20px', color: HS.ink3, fontFamily: HS.fontUI }}>
      <div style={{ fontSize: 36, marginBottom: 10 }}>🎉</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: HS.ink2 }}>Tutto in pari!</div>
      <div style={{ fontSize: 13, marginTop: 4 }}>Nessun task urgente per oggi.</div>
    </div>
  );
}

const urgencyOrder = { overdue: 0, urgent: 1, soon: 2, ok: 3 };
function sortedTasks(tasks) {
return [...tasks].sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);
}

function HomeDial({ tasks, tasksCompleted, onComplete, onOpen, onGoToScore, onSnooze, cardVariant }) {
const today = tasks.filter(t => t.urgency === 'overdue' || t.urgency === 'urgent');
const totalToday = today.length + tasksCompleted.length;
const pct = totalToday ? (tasksCompleted.length / totalToday) * 100 : 100;
const userMe = MOCK.users[0];
const hour = new Date().getHours();
const greet = hour < 12 ? 'Buongiorno' : hour < 18 ? 'Buon pomeriggio' : 'Buonasera';

return (
<div style={{ padding: '10px 18px 0' }}>
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
<div>
<div style={{ fontSize: 13, color: HS.ink2, fontFamily: HS.fontUI, fontWeight: 500 }}>{greet}, {userMe.name}</div>
<div style={{ fontSize: 12, color: HS.ink3, fontFamily: HS.fontUI }}>
{new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
</div>
</div>
<button onClick={onGoToScore} style={{ display: 'flex', gap: -6, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}>
{MOCK.users.map((u, i) => (
<div key={u.id} style={{ marginLeft: i === 0 ? 0 : -8 }}>
<Avatar user={u} size={34} ring />
</div>
))}
</button>
</div>

<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '18px 0 22px' }}>
<Dial pct={pct} size={210} stroke={14} color={HS.primary}>
<div style={{ textAlign: 'center' }}>
<div style={{
fontFamily: HS.fontDisplay, fontWeight: 500, fontSize: 56,
color: HS.ink, letterSpacing: -2, lineHeight: 1,
}}>{today.length}</div>
<div style={{
fontFamily: HS.fontUI, fontSize: 11, color: HS.ink2,
fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 4,
}}>da fare oggi</div>
{tasksCompleted.length > 0 && (
<div style={{
marginTop: 8, fontSize: 11, color: HS.sageInk, fontFamily: HS.fontUI,
display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600,
background: HS.sageSoft, padding: '3px 8px', borderRadius: 999,
}}>
<Icon name="check" size={12} color={HS.sageInk} strokeWidth={3} />
{tasksCompleted.length} fatti
</div>
)}
</div>
</Dial>

<div style={{ display: 'flex', gap: 10, marginTop: 14, width: '100%' }}>
{MOCK.users.map(u => (
<button key={u.id} onClick={onGoToScore} style={{ border: 'none', padding: 0, cursor: 'pointer', flex: 1 }}>
<div style={{
flex: 1, background: HS.card, borderRadius: HS.r.lg,
padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10,
boxShadow: HS.shadow.card,
}}>
<Avatar user={u} size={30} />
<div>
<div style={{ fontFamily: HS.fontUI, fontSize: 12, color: HS.ink3, fontWeight: 600 }}>{u.name}</div>
<div style={{ fontFamily: HS.fontDisplay, fontSize: 20, color: HS.ink, fontWeight: 500, letterSpacing: -0.5, lineHeight: 1 }}>
{u.total || 0} <span style={{ fontSize: 11, fontFamily: HS.fontUI, color: HS.ink3, fontWeight: 500 }}>pt</span>
</div>
</div>
</div>
</button>
))}
</div>
</div>

<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '4px 0 10px' }}>
<h3 style={{ margin: 0, fontFamily: HS.fontDisplay, fontSize: 22, color: HS.ink, fontWeight: 500, letterSpacing: -0.5 }}>In arrivo</h3>
<span style={{ fontFamily: HS.fontUI, fontSize: 12, color: HS.ink3, fontWeight: 600 }}>{today.length} task</span>
</div>
<div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 20 }}>
{sortedTasks(today).map(t => (
<TaskCard
key={t.id + '-' + (t.instance_date || t.next_due_date) + (t._ck ? '-' + t._ck : '')}
variant={cardVariant}
task={t}
room={MOCK.rooms.find(r => r.id === t.room)}
assignee={MOCK.users.find(u => u.id === t.assignee)}
onComplete={onComplete}
onOpen={onOpen}
onSnooze={onSnooze}
/>
))}
{today.length === 0 && <EmptyState />}
</div>
{tasksCompleted.length > 0 && <CompletedStrip tasks={tasksCompleted} onOpen={onOpen} />}
<div style={{ height: 120 }} />
</div>
);
}

function HomeChannels({ tasks, tasksCompleted, onComplete, onOpen, onGoToScore, onSnooze, cardVariant }) {
const today = tasks.filter(t => t.urgency === 'overdue' || t.urgency === 'urgent');
const shared = today.filter(t => t.assignee === 'both');
const byUser = (uid) => sortedTasks(today.filter(t => t.assignee === uid));
const userMe = MOCK.users[0];

return (
<div style={{ padding: '10px 18px 0' }}>
<div style={{
background: `linear-gradient(135deg, ${HS.primarySoft} 0%, ${HS.soonSoft} 100%)`,
borderRadius: HS.r.xl, padding: '18px 18px 16px', marginBottom: 18,
position: 'relative', overflow: 'hidden',
}}>
<div style={{ fontFamily: HS.fontUI, fontSize: 12, color: HS.primaryInk, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Oggi insieme</div>
<div style={{ fontFamily: HS.fontDisplay, fontSize: 34, color: HS.ink, fontWeight: 500, letterSpacing: -1, lineHeight: 1.05, marginTop: 2 }}>
{today.length} cose da fare
</div>
<div style={{ fontFamily: HS.fontUI, fontSize: 13, color: HS.ink2, marginTop: 4 }}>
{tasksCompleted.length > 0 ? `Già fatti: ${tasksCompleted.length}` : 'Nessuna ancora fatta'}
</div>
<div style={{ marginTop: 14, height: 8, background: 'rgba(255,255,255,0.6)', borderRadius: 999, overflow: 'hidden' }}>
<div style={{
width: `${today.length + tasksCompleted.length ? (tasksCompleted.length / (today.length + tasksCompleted.length)) * 100 : 100}%`,
height: '100%', background: HS.primary, transition: 'width .6s cubic-bezier(.2,.9,.3,1)',
}} />
</div>
</div>

{shared.length > 0 && (
<div style={{ marginBottom: 18 }}>
<div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
<BothAvatar users={MOCK.users} size={34} />
<div style={{ flex: 1 }}>
<div style={{ fontFamily: HS.fontDisplay, fontSize: 20, color: HS.ink, fontWeight: 500, letterSpacing: -0.4, lineHeight: 1 }}>Insieme</div>
<div style={{ fontFamily: HS.fontUI, fontSize: 11, color: HS.ink3, marginTop: 2 }}>
{shared.length} task · chi lo fa per primo guadagna i punti
</div>
</div>
</div>
<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
{shared.map(t => (
<TaskCard key={t.id + '-' + (t.instance_date || t.next_due_date) + (t._ck ? '-' + t._ck : '')} variant={cardVariant} task={t}
room={MOCK.rooms.find(r => r.id === t.room)}
assignee={MOCK.users[0]}
onComplete={onComplete} onOpen={onOpen} onSnooze={onSnooze} />
))}
</div>
</div>
)}

<div style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingBottom: 20 }}>
{MOCK.users.map((u) => {
const list = byUser(u.id);
const isMe = u.id === userMe.id;
return (
<div key={u.id}>
<div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
<Avatar user={u} size={34} />
<div style={{ flex: 1 }}>
<div style={{ fontFamily: HS.fontDisplay, fontSize: 20, color: HS.ink, fontWeight: 500, letterSpacing: -0.4, lineHeight: 1 }}>
{isMe ? 'Tu' : u.name}
</div>
<div style={{ fontFamily: HS.fontUI, fontSize: 11, color: HS.ink3, marginTop: 2 }}>
{list.length} task da fare
</div>
</div>
<button onClick={onGoToScore} style={{
border: 'none', cursor: 'pointer',
fontFamily: HS.fontUI, fontSize: 11, fontWeight: 700, color: u.color,
background: u.color + '1a', padding: '4px 10px', borderRadius: 999,
}}>{u.total} pt</button>
</div>
<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
{list.length === 0 && (
<div style={{
padding: 14, borderRadius: HS.r.lg, background: HS.card, boxShadow: HS.shadow.card,
fontFamily: HS.fontUI, fontSize: 13, color: HS.ink3, textAlign: 'center',
}}>🎉 Niente per {isMe ? 'te' : u.name} oggi</div>
)}
{list.map(t => (
<TaskCard
key={t.id + '-' + (t.instance_date || t.next_due_date) + (t._ck ? '-' + t._ck : '')}
variant={cardVariant} task={t}
room={MOCK.rooms.find(r => r.id === t.room)}
assignee={u}
onComplete={onComplete} onOpen={onOpen} onSnooze={onSnooze}
/>
))}
</div>
</div>
);
})}
</div>
{tasksCompleted.length > 0 && <CompletedStrip tasks={tasksCompleted} onOpen={onOpen} />}
<div style={{ height: 120 }} />
</div>
);
}

function CompletedStrip({ tasks, onOpen }) {
return (
<div style={{ marginTop: 8 }}>
<div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0 10px' }}>
<Icon name="check" size={14} color={HS.sageInk} strokeWidth={3} />
<h3 style={{ margin: 0, fontFamily: HS.fontDisplay, fontSize: 20, color: HS.ink, fontWeight: 500, letterSpacing: -0.4 }}>Fatti oggi</h3>
<span style={{ fontFamily: HS.fontUI, fontSize: 12, color: HS.ink3, fontWeight: 600, marginLeft: 'auto' }}>{tasks.length}</span>
</div>
<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
{tasks.map(t => {
const by = t.completedBy || t.assignee;
const isBoth = by === 'both';
const found = isBoth ? null : (MOCK.users.find(u => u.id === by) || MOCK.users[0]);
const users = isBoth ? MOCK.users : [found].filter(Boolean);
if (!isBoth && users.length === 0) return null;
return (
<button key={t.id + (t.completedAt || '')}
onClick={() => onOpen && onOpen(t)}
style={{
border: 'none', background: HS.card, borderRadius: HS.r.md,
padding: '10px 14px', boxShadow: HS.shadow.card, cursor: 'pointer',
display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
}}>
{isBoth ? <BothAvatar users={users} size={24} /> : <Avatar user={users[0]} size={26} />}
<div style={{ flex: 1, minWidth: 0 }}>
<div style={{
fontFamily: HS.fontUI, fontSize: 14, fontWeight: 600, color: HS.ink2,
textDecoration: 'line-through', textDecorationColor: HS.ink3,
whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
}}>{t.name}</div>
<div style={{ fontFamily: HS.fontUI, fontSize: 11, color: HS.ink3, marginTop: 1 }}>
{isBoth ? 'Insieme' : (users[0]?.name || '')} · tocca per modificare
</div>
</div>
<span style={{
padding: '3px 8px', borderRadius: 999, background: HS.sageSoft,
fontFamily: HS.fontUI, fontSize: 11, fontWeight: 700, color: HS.sageInk,
display: 'inline-flex', alignItems: 'center', gap: 2,
}}>
+{t.awardedPoints || t.points} <Icon name="bolt" size={9} color={HS.sageInk} strokeWidth={3} />
</span>
</button>
);
})}
</div>
</div>
);
}

function RoomsScreen({ tasks, completed, rooms, onComplete, onOpen }) {
const [selectedRoom, setSelectedRoom] = React.useState(null);

const roomStats = (rId) => {
const all = tasks.filter(t => t.room === rId || t.rooms?.includes(rId));
const done = completed.filter(c => c.room === rId || c.rooms?.includes(rId)).length;
return { total: all.length + done, done };
};

const getUpcomingTasks = (rId) => {
const now = new Date(); now.setHours(0, 0, 0, 0);
const cutoff = new Date(now); cutoff.setDate(cutoff.getDate() + 14);
return tasks
  .filter(t => t.room === rId || t.rooms?.includes(rId))
  .filter(t => {
    if (!t.next_due_date) return false;
    const d = new Date(t.next_due_date + 'T00:00:00');
    return d <= cutoff;
  })
  .sort((a, b) => (a.next_due_date || '') < (b.next_due_date || '') ? -1 : 1)
  .slice(0, 10);
};

const today = tasks.filter(t => t.urgency === 'overdue' || t.urgency === 'urgent');

return (
<div style={{ padding: '10px 18px 140px' }}>
<h2 style={{ margin: '2px 0 14px', fontFamily: HS.fontDisplay, fontSize: 32, color: HS.ink, fontWeight: 500, letterSpacing: -1 }}>Stanze</h2>
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
{rooms.map(r => {
const stats = roomStats(r.id);
const pct = stats.total ? Math.round((stats.done / stats.total) * 100) : 100;
const rToday = today.filter(t => t.room === r.id || t.rooms?.includes(r.id));
const isActive = selectedRoom === r.id;
return (
<button key={r.id} onClick={() => setSelectedRoom(isActive ? null : r.id)} style={{
all: 'unset', cursor: 'pointer',
background: HS.card, borderRadius: HS.r.xl, padding: 16,
boxShadow: isActive ? `0 0 0 2px ${r.color}` : HS.shadow.card,
display: 'flex', flexDirection: 'column', gap: 12,
transition: 'box-shadow .15s ease', textAlign: 'left',
}}>
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
<div style={{
width: 44, height: 44, borderRadius: 12,
background: r.color + '1a', color: r.color,
display: 'flex', alignItems: 'center', justifyContent: 'center',
}}>
<Icon name={roomIcon(r.icon)} size={20} color={r.color} strokeWidth={2} />
</div>
<span style={{
fontFamily: HS.fontUI, fontSize: 13, fontWeight: 700,
color: pct === 100 ? HS.sageInk : HS.primary,
}}>{pct}%</span>
</div>
<div>
<div style={{ fontFamily: HS.fontUI, fontSize: 16, fontWeight: 700, color: HS.ink }}>{r.name}</div>
<div style={{ fontFamily: HS.fontUI, fontSize: 11.5, color: HS.ink3, marginTop: 1 }}>
{rToday.length > 0 ? `${rToday.length} da fare oggi` : 'In pari'}
</div>
</div>
<div style={{ height: 6, background: HS.bgSunken, borderRadius: 999, overflow: 'hidden' }}>
<div style={{ width: `${pct}%`, height: '100%', background: r.color, transition: 'width .4s ease' }} />
</div>
</button>
);
})}
</div>

{selectedRoom && (() => {
const r = rooms.find(x => x.id === selectedRoom);
if (!r) return null;
const upcoming = getUpcomingTasks(selectedRoom);
return (
<div style={{ marginTop: 20, background: HS.card, borderRadius: HS.r.xl, boxShadow: HS.shadow.card, overflow: 'hidden' }}>
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px', borderBottom: '1px solid ' + HS.hairline }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: r.color + '1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={roomIcon(r.icon)} size={16} color={r.color} strokeWidth={2} />
      </div>
      <div>
        <div style={{ fontFamily: HS.fontUI, fontSize: 15, fontWeight: 700, color: HS.ink }}>{r.name}</div>
        <div style={{ fontFamily: HS.fontUI, fontSize: 11, color: HS.ink3 }}>prossime 2 settimane</div>
      </div>
    </div>
    <button onClick={() => setSelectedRoom(null)} style={{ border: 'none', background: HS.bgSunken, borderRadius: 8, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon name="x" size={14} color={HS.ink2} strokeWidth={2.5} />
    </button>
  </div>
  {upcoming.length === 0 ? (
    <div style={{ padding: '20px', textAlign: 'center', fontFamily: HS.fontUI, fontSize: 13, color: HS.ink3 }}>Nessun task nei prossimi 14 giorni 🎉</div>
  ) : upcoming.map(t => {
    const urg = (window.URGENCY_STYLES || {})[t.urgency] || {};
    return (
      <div key={t.id} onClick={() => onOpen && onOpen(t)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '1px solid ' + HS.hairline, cursor: 'pointer' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
        <div style={{ width: 4, height: 32, borderRadius: 2, background: urg.bar || r.color, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: HS.fontUI, fontSize: 14, fontWeight: 600, color: HS.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</div>
          <div style={{ fontFamily: HS.fontUI, fontSize: 11, color: HS.ink3 }}>{t.due}</div>
        </div>
        <Icon name="chevron" size={14} color={HS.ink3} strokeWidth={2} />
      </div>
    );
  })}
</div>
);
})()}
</div>
);
}

function roomStats(rId, tasks, completed) {
const all = tasks.filter(t => t.room === rId || t.rooms?.includes(rId));
const done = completed.filter(c => c.room === rId || c.rooms?.includes(rId)).length;
return { total: all.length + done, done };
}

function startOfWeek(d) {
const x = new Date(d);
x.setHours(0, 0, 0, 0);
const day = x.getDay();
const diff = (day === 0 ? -6 : 1 - day);
x.setDate(x.getDate() + diff);
return x;
}

function CalendarScreen({ tasks, onOpen }) {
const allInstances = window.__hs_all_tasks || tasks;
const expandedInstances = React.useMemo(function() {
  var result = [];
  for (var i = 0; i < allInstances.length; i++) {
    var t = allInstances[i];
    result.push(t);
    
    var dow = [];
    if (t.tags) {
      try {
        var parsed = JSON.parse(t.tags);
        if (Array.isArray(parsed)) {
          dow = parsed
            .filter(function(tag) { return String(tag).startsWith('day:'); })
            .map(function(tag) { return parseInt(String(tag).replace('day:', ''), 10); });
        }
      } catch(e) {}
    }

    var freq = t.everyDays || t.frequency_days;
    if ((freq && freq > 0 || dow.length > 0) && t.next_due_date) {
      var parts = t.next_due_date.split('-').map(Number);
      var cursor = new Date(parts[0], parts[1] - 1, parts[2]);
      
      if (dow.length > 0) {
        cursor = window.getNextDayOfWeek ? window.getNextDayOfWeek(cursor, dow) : cursor;
      } else {
        cursor.setDate(cursor.getDate() + freq);
        var _wd0 = cursor.getDay();
        if (_wd0 === 6) cursor.setDate(cursor.getDate() + 2);      // Sab → Lun
        else if (_wd0 === 0) cursor.setDate(cursor.getDate() + 2); // Dom → Mar
      }

      var maxDate = new Date();
      maxDate.setMonth(maxDate.getMonth() + 6);
      var count = 0;
      while (cursor <= maxDate && count < 30) {
        var ds = cursor.getFullYear() + '-' +
          String(cursor.getMonth() + 1).padStart(2, '0') + '-' +
          String(cursor.getDate()).padStart(2, '0');
        result.push({
          ...t,
          id: t.id + '_cal_' + count,
          next_due_date: ds,
          instance_date: ds,
        });

        if (dow.length > 0) {
          cursor = window.getNextDayOfWeek ? window.getNextDayOfWeek(cursor, dow) : cursor;
        } else {
          cursor.setDate(cursor.getDate() + freq);
          var _wd1 = cursor.getDay();
          if (_wd1 === 6) cursor.setDate(cursor.getDate() + 2);      // Sab → Lun
          else if (_wd1 === 0) cursor.setDate(cursor.getDate() + 2); // Dom → Mar
        }
        count++;
      }
    }
  }
  return result;
}, [allInstances]);
const days = ["L", "M", "M", "G", "V", "S", "D"];
const MONTHS = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
const today = new Date();
const [viewDate, setViewDate] = React.useState(new Date(today.getFullYear(), today.getMonth(), 1));
const [selectedDay, setSelectedDay] = React.useState(null);

const year = viewDate.getFullYear();
const month = viewDate.getMonth();
const firstDay = new Date(year, month, 1);
const daysInMonth = new Date(year, month + 1, 0).getDate();
let startOffset = firstDay.getDay() - 1;
if (startOffset < 0) startOffset = 6;

const cells = [];
for (let i = 0; i < startOffset; i++) cells.push(null);
for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

const tasksForDay = (cell) => {
if (!cell) return [];
const ds = cell.getFullYear() + '-' + String(cell.getMonth()+1).padStart(2,'0') + '-' + String(cell.getDate()).padStart(2,'0');
return expandedInstances.filter(t => {
const td = t.instance_date || t.next_due_date;
return td === ds;
});
};

const selectedTasks = selectedDay ? tasksForDay(selectedDay) : [];

const dayColor = (cell) => {
if (!cell) return "";
const t = tasksForDay(cell);
if (t.length === 0) return "";
const minDue = Math.min(...t.map(x => {
const d = x.instance_date || x.next_due_date;
if (!d) return 999;
return Math.round((new Date(d + "T00:00:00") - new Date(today.toDateString())) / 86400000);
}));
if (minDue < 0) return "#9333EA";
if (minDue <= 1) return "#DC2626";
if (minDue <= 3) return "#D97706";
return "#16A34A";
};

const goToToday = () => {
setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
setSelectedDay(new Date(today));
};

return (
<div style={{ padding: "10px 18px 140px" }}>
<h2 style={{ margin: "2px 0 14px", fontFamily: HS.fontDisplay, fontSize: 32, color: HS.ink, fontWeight: 500, letterSpacing: -1 }}>Calendario</h2>
<div style={{
display: "flex", alignItems: "center", justifyContent: "space-between",
background: HS.card, borderRadius: HS.r.lg, padding: "10px 14px",
boxShadow: HS.shadow.card, marginBottom: 10,
}}>
<button onClick={() => setViewDate(new Date(year, month - 1, 1))}
style={{ border: "none", background: HS.bgSunken, borderRadius: 10, width: 34, height: 34, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
<Icon name="chevronL" size={18} color={HS.ink2} strokeWidth={2.5} />
</button>
<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
<div style={{ fontFamily: HS.fontDisplay, fontSize: 20, color: HS.ink, fontWeight: 500, letterSpacing: -0.5 }}>
{MONTHS[month]} {year}
</div>
{!isCurrentMonth && (
<button onClick={goToToday} style={{
border: "none", background: HS.primary, borderRadius: 8, padding: "4px 10px",
cursor: "pointer", fontFamily: HS.fontUI, fontSize: 11, fontWeight: 700, color: "#fff",
}}>Oggi</button>
)}
</div>
<button onClick={() => setViewDate(new Date(year, month + 1, 1))}
style={{ border: "none", background: HS.bgSunken, borderRadius: 10, width: 34, height: 34, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
<Icon name="chevron" size={18} color={HS.ink2} strokeWidth={2.5} />
</button>
</div>

<div style={{ background: HS.card, borderRadius: HS.r.lg, padding: "12px 10px", boxShadow: HS.shadow.card, marginBottom: 10 }}>
<div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
{days.map((d, i) => (
<div key={i} style={{ textAlign: "center", fontFamily: HS.fontUI, fontSize: 10, color: HS.ink3, fontWeight: 700, paddingBottom: 4 }}>{d}</div>
))}
</div>
<div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>
{cells.map((cell, i) => {
if (!cell) return <div key={"e" + i} />;
const isThisToday = cell.toDateString() === today.toDateString();
const isSelected = selectedDay && cell.toDateString() === selectedDay.toDateString();
const hasTasks = tasksForDay(cell).length > 0;
const urgColor = dayColor(cell);
return (
<button key={i} onClick={() => setSelectedDay(isSelected ? null : cell)}
style={{
aspectRatio: "1", borderRadius: 10, border: "none", cursor: "pointer", position: "relative",
background: isSelected ? "#1a1a1a" : isThisToday ? HS.primary + "22" : hasTasks ? urgColor + "18" : HS.bgSunken,
color: isSelected ? "#fff" : isThisToday ? "#000" : HS.ink,
display: "flex", alignItems: "center", justifyContent: "center",
fontFamily: HS.fontUI, fontSize: 14, fontWeight: isThisToday || isSelected ? 700 : 500,
outline: isThisToday && !isSelected ? "3px solid " + HS.primary : "none",
outlineOffset: -3,
transition: "all .12s ease",
}}>
{cell.getDate()}
{hasTasks && (
<React.Fragment>
<div style={{ position: "absolute", top: 1, right: 2, fontSize: 8, fontWeight: 700, color: isSelected ? "#fff" : urgColor, lineHeight: 1 }}>
{tasksForDay(cell).length}
</div>
<div style={{ position: "absolute", bottom: 2, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 2 }}>
<div style={{ width: 6, height: 6, borderRadius: 3, background: isSelected ? "#fff" : urgColor }} />
</div>
</React.Fragment>
)}
</button>
);
})}
</div>
</div>

<div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10, padding: "0 2px" }}>
{[
{ color: "#A855F7", label: "Scaduto" },
{ color: "#EF4444", label: "Oggi/domani" },
{ color: "#EAB308", label: "1-3 giorni" },
{ color: "#22C55E", label: ">3 giorni" },
].map(({ color, label }) => (
<div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
<div style={{ width: 8, height: 8, borderRadius: 4, background: color }} />
<span style={{ fontFamily: HS.fontUI, fontSize: 10, color: HS.ink3, fontWeight: 600 }}>{label}</span>
</div>
))}
</div>

{selectedDay && (
<div style={{ background: HS.card, borderRadius: HS.r.lg, boxShadow: HS.shadow.card, overflow: "hidden" }}>
<div style={{
display: "flex", justifyContent: "space-between", alignItems: "center",
padding: "12px 14px 8px", borderBottom: "1px solid " + HS.hairline,
}}>
<h3 style={{ fontFamily: HS.fontDisplay, fontSize: 18, color: HS.ink, fontWeight: 500 }}>
{selectedDay.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}
</h3>
<button onClick={() => setSelectedDay(null)} style={{ border: "none", background: HS.bgSunken, borderRadius: 8, width: 26, height: 26, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
<Icon name="x" size={14} color={HS.ink2} strokeWidth={2.5} />
</button>
</div>
{selectedTasks.length === 0 ? (
<div style={{ padding: "20px", textAlign: "center", fontFamily: HS.fontUI, fontSize: 13, color: HS.ink3 }}>
Nessun task in scadenza questo giorno.
</div>
) : (
selectedTasks.map(t => {
const isBoth = t.assignee === "both";
const u = isBoth ? null : MOCK.users.find(x => x.id === t.assignee);
const urg = (window.URGENCY_STYLES || URGENCY_STYLES)[t.urgency] || {};
return (
<div key={t.id + "-" + (t.instance_date || t.next_due_date)}
onClick={() => onOpen && onOpen(t)}
style={{
display: "flex", alignItems: "center", gap: 10,
padding: "10px 14px", borderBottom: "1px solid " + HS.hairline,
cursor: "pointer",
transition: "background 0.2s ease",
}}
onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.02)"}
onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
>
<div style={{ width: 4, height: 32, borderRadius: 2, background: urg.bar, flexShrink: 0 }} />
<div style={{ flex: 1, minWidth: 0 }}>
<div style={{ fontFamily: HS.fontUI, fontSize: 14, fontWeight: 600, color: HS.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</div>
<div style={{ fontFamily: HS.fontUI, fontSize: 11, color: HS.ink3 }}>
  {t.due}
  {(() => {
    var recurrence = '';
    var dow = [];
    if (t.tags) {
      try {
        var parsed = typeof t.tags === 'string' ? JSON.parse(t.tags) : t.tags;
        if (Array.isArray(parsed)) {
          dow = parsed
            .filter(function(tag) { return String(tag).startsWith('day:'); })
            .map(function(tag) { return parseInt(String(tag).replace('day:', ''), 10); });
        }
      } catch(e) {}
    }
    if (dow.length > 0) {
      var dayNames = { 1: 'lun', 2: 'mar', 3: 'mer', 4: 'gio', 5: 'ven', 6: 'sab', 0: 'dom' };
      var sorted = [...dow].sort((a, b) => {
        var va = a === 0 ? 7 : a;
        var vb = b === 0 ? 7 : b;
        return va - vb;
      });
      recurrence = sorted.map(d => dayNames[d]).join(', ');
    } else {
      var freq = t.everyDays || t.frequency_days;
      if (freq && freq > 0) {
        recurrence = 'ogni ' + freq + 'gg';
      }
    }
    return recurrence ? ' · ' + recurrence : '';
  })()}
</div>
</div>
{isBoth ? <BothAvatar users={MOCK.users} size={24} /> : <Avatar user={u} size={26} />}
</div>
);
})
)}
</div>
)}
</div>
);
}

function ScoreScreen({ completed = [] }) {
const [a, b] = MOCK.users;
const total = (a.total || 0) + (b.total || 0);
const aPct = total ? ((a.total || 0) / total) * 100 : 50;
const recent = [...completed]
.sort((x, y) => (y.completedAt || 0) - (x.completedAt || 0))
.slice(0, 8);
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

return (
<div style={{ padding: '10px 18px 140px' }}>
<h2 style={{ margin: '2px 0 14px', fontFamily: HS.fontDisplay, fontSize: 32, color: HS.ink, fontWeight: 500, letterSpacing: -1 }}>Classifica</h2>
<div style={{
background: `linear-gradient(135deg, ${a.color} 0%, ${b.color} 100%)`,
borderRadius: HS.r.xl, padding: 22, color: '#fff',
marginBottom: 16, boxShadow: HS.shadow.pop,
}}>
<div style={{ fontFamily: HS.fontUI, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, opacity: 0.85 }}>Punti Totali Accumulati</div>
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
<Avatar user={a} size={50} />
<div style={{ fontFamily: HS.fontDisplay, fontSize: 40, fontWeight: 500, letterSpacing: -1, lineHeight: 1 }}>{a.total}</div>
<div style={{ fontFamily: HS.fontUI, fontSize: 12, fontWeight: 600 }}>{a.name}</div>
</div>
<div style={{ fontFamily: HS.fontDisplay, fontSize: 28, fontStyle: 'italic', fontWeight: 300, opacity: 0.85 }}>vs</div>
<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
<Avatar user={b} size={50} />
<div style={{ fontFamily: HS.fontDisplay, fontSize: 40, fontWeight: 500, letterSpacing: -1, lineHeight: 1 }}>{b.total}</div>
<div style={{ fontFamily: HS.fontUI, fontSize: 12, fontWeight: 600 }}>{b.name}</div>
</div>
</div>
<div style={{ marginTop: 16, height: 10, background: 'rgba(255,255,255,0.25)', borderRadius: 999, overflow: 'hidden', display: 'flex' }}>
<div style={{ width: `${aPct}%`, background: '#fff', transition: 'width .6s ease' }} />
</div>
</div>

<h3 style={{ margin: '8px 0 10px', fontFamily: HS.fontDisplay, fontSize: 20, color: HS.ink, fontWeight: 500 }}>Storico recente</h3>
<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
{recent.length === 0 && (
<div style={{
padding: '20px 16px', textAlign: 'center', background: HS.card,
borderRadius: HS.r.lg, boxShadow: HS.shadow.card,
fontFamily: HS.fontUI, fontSize: 13, color: HS.ink3,
}}>Nessun task ancora completato</div>
)}
{recent.map(h => {
const isBoth = h.completedBy === 'both';
const u = isBoth ? null : MOCK.users.find(x => x.id === h.completedBy);
const pts = h.awardedPoints || h.points;
return (
<div key={h.id + (h.completedAt || '')} style={{
display: 'flex', alignItems: 'center', gap: 10,
background: HS.card, borderRadius: HS.r.md,
padding: '10px 14px', boxShadow: HS.shadow.card,
}}>
{isBoth ? <BothAvatar users={MOCK.users} size={28} /> : <Avatar user={u} size={30} />}
<div style={{ flex: 1, minWidth: 0 }}>
<div style={{ fontFamily: HS.fontUI, fontSize: 13.5, fontWeight: 600, color: HS.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.name}</div>
<div style={{ fontFamily: HS.fontUI, fontSize: 11, color: HS.ink3 }}>{isBoth ? 'Insieme' : u?.name} · {relTime(h.completedAt)}</div>
</div>
<div style={{
display: 'inline-flex', alignItems: 'center', gap: 3,
padding: '4px 8px', borderRadius: 999, background: HS.primarySoft,
fontFamily: HS.fontUI, fontSize: 12, fontWeight: 700, color: HS.primaryInk,
}}>
+{pts}<Icon name="bolt" size={10} color={HS.primaryInk} strokeWidth={2.6} />
</div>
</div>
);
})}
</div>
</div>
);
}

Object.assign(window, { HomeDial, HomeChannels, RoomsScreen, CalendarScreen, ScoreScreen, CompletedStrip, roomStats, startOfWeek });
