// Task cards — three completion-interaction variants

const URGENCY_STYLES = {
overdue: { bar: '#8C5AC8', bg: '#F7F1FA', ink: '#432970', label: 'Scaduto' },
urgent: { bar: '#D94B4B', bg: '#FDF0ED', ink: '#7A1E1E', label: 'Oggi' },
soon: { bar: '#E0A93A', bg: '#FDF7E8', ink: '#6D4A0E', label: 'Presto' },
ok: { bar: '#6F9E7A', bg: '#F1F7EF', ink: '#2E5536', label: 'OK' },
};

function TaskMeta({ task, room, u }) {
const urg = URGENCY_STYLES[task.urgency] || URGENCY_STYLES.ok;
return (
<div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
<span style={{
fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase',
color: urg.ink, background: urg.bg, padding: '3px 7px', borderRadius: 999,
fontFamily: HS.fontUI,
}}>{urg.label}</span>
<span style={{ fontSize: 12, color: HS.ink2, display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: HS.fontUI }}>
<Icon name="clock" size={12} color={HS.ink3} strokeWidth={2.2} />
{task.due}
</span>
{(() => {
  var recurrence = '';
  var dow = [];
  if (task.tags) {
    try {
      var parsed = typeof task.tags === 'string' ? JSON.parse(task.tags) : task.tags;
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
    var freq = task.everyDays || task.frequency_days;
    if (freq && freq > 0) {
      recurrence = 'ogni ' + freq + 'gg';
    }
  }
  return recurrence ? (
    <span style={{ fontSize: 12, color: HS.ink3, fontFamily: HS.fontUI }}>· {recurrence}</span>
  ) : null;
})()}
{(() => {
  var roomNames = '';
  if (task.roomIds && Array.isArray(task.roomIds) && task.roomIds.length > 0) {
    roomNames = task.roomIds.map(rid => {
      var rm = window.MOCK?.rooms?.find(r => r.id === rid || r._backendId === rid);
      return rm ? rm.name : null;
    }).filter(Boolean).join(', ');
  } else if (room) {
    roomNames = room.name;
  }
  return roomNames ? (
    <span style={{ fontSize: 12, color: HS.ink3, fontFamily: HS.fontUI }}>· {roomNames}</span>
  ) : null;
})()}
<span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: HS.ink2, fontWeight: 600, fontFamily: HS.fontUI }}>
<Icon name="bolt" size={12} color={HS.primary} strokeWidth={2.4} />
{task.points}
</span>
</div>
);
}

function TaskCardTap({ task, room, assignee, onComplete, onOpen }) {
const urg = URGENCY_STYLES[task.urgency] || URGENCY_STYLES.ok;
const [burst, setBurst] = React.useState(false);
const [done, setDone] = React.useState(false);
const go = (e) => {
e.stopPropagation();
setBurst(true);
setDone(true);
setTimeout(() => { onComplete && onComplete(task); }, 420);
};
return (
<div style={{
position: 'relative',
display: 'flex', alignItems: 'stretch',
background: HS.card, borderRadius: HS.r.lg,
boxShadow: HS.shadow.card,
overflow: 'hidden',
opacity: done ? 0.3 : 1,
transform: done ? 'scale(0.97)' : 'scale(1)',
transition: 'opacity .3s ease, transform .3s ease',
}}>
<div style={{ width: 5, background: urg.bar }} />
<div onClick={() => onOpen && onOpen(task)} style={{ flex: 1, padding: '12px 12px 12px 14px', minWidth: 0, cursor: onOpen ? 'pointer' : 'default' }}>
<div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
{task.assignee === 'both' ? <BothAvatar users={MOCK.users} size={22} /> : <Avatar user={assignee} size={22} />}
<h3 style={{
margin: 0, fontSize: 15.5, fontWeight: 600, color: HS.ink,
fontFamily: HS.fontUI, letterSpacing: -0.1,
overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
}}>{task.name}</h3>
</div>
<TaskMeta task={task} room={room} />
</div>
<button
onClick={go}
style={{
flexShrink: 0, border: 'none', background: 'transparent',
padding: '0 14px', cursor: 'pointer', display: 'flex', alignItems: 'center',
}}
>
<div style={{
width: 44, height: 44, borderRadius: '50%',
background: done ? HS.sage : HS.bg,
border: `2px solid ${done ? HS.sage : HS.hairline}`,
display: 'flex', alignItems: 'center', justifyContent: 'center',
transition: 'all .2s ease',
transform: done ? 'scale(1.08)' : 'scale(1)',
}}>
<Icon name="check" size={22} color={done ? '#fff' : HS.ink3} strokeWidth={3} />
</div>
</button>
<Confetti show={burst} originX={0.88} originY={0.5} />
</div>
);
}

function TaskCardSwipe({ task, room, assignee, onComplete, onSnooze, onOpen }) {
const urg = URGENCY_STYLES[task.urgency] || URGENCY_STYLES.ok;
const [dx, setDx] = React.useState(0);
const [dragging, setDragging] = React.useState(false);
const [done, setDone] = React.useState(false);
const startX = React.useRef(null);
const THRESHOLD = 110;

const onStart = (clientX) => { startX.current = clientX; setDragging(true); };
const onMove = (clientX) => {
if (startX.current == null) return;
let d = clientX - startX.current;
d = Math.max(-180, Math.min(220, d));
setDx(d);
};
const onEnd = () => {
if (dx > THRESHOLD) {
setDone(true);
setDx(400);
setTimeout(() => onComplete && onComplete(task), 320);
} else if (dx < -THRESHOLD) {
onSnooze && onSnooze(task);
setDx(0);
} else {
setDx(0);
}
startX.current = null;
setDragging(false);
};

const progress = Math.max(0, Math.min(1, dx / THRESHOLD));
const snoozeProg = Math.max(0, Math.min(1, -dx / THRESHOLD));

return (
<div style={{
position: 'relative', borderRadius: HS.r.lg, overflow: 'hidden',
boxShadow: HS.shadow.card, background: HS.card,
opacity: done ? 0.3 : 1,
transition: 'opacity .2s ease',
}}>
<div style={{
position: 'absolute', inset: 0,
background: `linear-gradient(90deg, ${HS.sageSoft} 0%, ${HS.sage} 100%)`,
display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
paddingLeft: 24, color: '#fff',
opacity: progress,
}}>
<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
<div style={{
width: 36, height: 36, borderRadius: '50%',
background: 'rgba(255,255,255,0.25)',
display: 'flex', alignItems: 'center', justifyContent: 'center',
transform: `scale(${0.6 + 0.6 * progress})`,
}}>
<Icon name="check" size={22} color="#fff" strokeWidth={3} />
</div>
<span style={{ fontWeight: 700, fontFamily: HS.fontUI, fontSize: 14 }}>
{progress >= 1 ? 'Rilascia!' : 'Fatto'}
</span>
</div>
</div>
<div style={{
position: 'absolute', inset: 0,
background: `linear-gradient(270deg, ${HS.soonSoft} 0%, ${HS.soon} 100%)`,
display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
paddingRight: 24, color: '#fff',
opacity: snoozeProg,
}}>
<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
<span style={{ fontWeight: 700, fontFamily: HS.fontUI, fontSize: 14 }}>Rinvia</span>
<div style={{
width: 36, height: 36, borderRadius: '50%',
background: 'rgba(255,255,255,0.25)',
display: 'flex', alignItems: 'center', justifyContent: 'center',
transform: `scale(${0.6 + 0.6 * snoozeProg})`,
}}>
<Icon name="clock" size={20} color="#fff" strokeWidth={2.5} />
</div>
</div>
</div>
<div
onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); onStart(e.clientX); }}
onPointerMove={(e) => onMove(e.clientX)}
onPointerUp={onEnd}
onPointerCancel={onEnd}
style={{
display: 'flex', alignItems: 'stretch',
background: HS.card,
transform: `translateX(${dx}px)`,
transition: dragging ? 'none' : 'transform .3s cubic-bezier(.2,.9,.3,1)',
touchAction: 'pan-y',
cursor: dragging ? 'grabbing' : 'grab',
userSelect: 'none',
}}
>
<div style={{ width: 5, background: urg.bar }} />
<div onClick={(e) => { if (Math.abs(dx) < 6) { onOpen && onOpen(task); } }} style={{ flex: 1, padding: '14px 18px', minWidth: 0 }}>
<div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
{task.assignee === 'both' ? <BothAvatar users={MOCK.users} size={22} /> : <Avatar user={assignee} size={22} />}
<h3 style={{
margin: 0, fontSize: 15.5, fontWeight: 600, color: HS.ink,
fontFamily: HS.fontUI, letterSpacing: -0.1, flex: 1,
overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
}}>{task.name}</h3>
<Icon name="dots" size={18} color={HS.ink3} />
</div>
<TaskMeta task={task} room={room} />
</div>
</div>
</div>
);
}

function TaskCardHold({ task, room, assignee, onComplete, onOpen }) {
const urg = URGENCY_STYLES[task.urgency] || URGENCY_STYLES.ok;
const [progress, setProgress] = React.useState(0);
const [done, setDone] = React.useState(false);
const [burst, setBurst] = React.useState(false);
const timer = React.useRef(null);
const start = React.useRef(null);
const HOLD = 700;

const tick = () => {
const elapsed = performance.now() - start.current;
const p = Math.min(1, elapsed / HOLD);
setProgress(p);
if (p >= 1) {
setDone(true); setBurst(true);
setTimeout(() => onComplete && onComplete(task), 420);
return;
}
timer.current = requestAnimationFrame(tick);
};

const begin = (e) => {
if (done) return;
start.current = performance.now();
timer.current = requestAnimationFrame(tick);
};
const end = () => {
cancelAnimationFrame(timer.current);
if (progress < 1) setProgress(0);
};

return (
<div style={{
position: 'relative',
display: 'flex', alignItems: 'stretch',
background: HS.card, borderRadius: HS.r.lg,
boxShadow: HS.shadow.card, overflow: 'hidden',
opacity: done ? 0.3 : 1, transition: 'opacity .3s',
transform: done ? 'scale(0.97)' : 'scale(1)',
userSelect: 'none',
}}>
<div style={{
position: 'absolute', inset: 0,
background: `linear-gradient(90deg, ${HS.sageSoft} 0%, ${HS.sageSoft} ${progress*100}%, transparent ${progress*100}%)`,
transition: progress === 0 ? 'background .2s' : 'none',
}} />
<div style={{ width: 5, background: urg.bar, position: 'relative' }} />
<div onClick={() => onOpen && onOpen(task)} style={{ flex: 1, padding: '14px 14px 14px 16px', minWidth: 0, position: 'relative', cursor: onOpen ? 'pointer' : 'default' }}>
<div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
{task.assignee === 'both' ? <BothAvatar users={MOCK.users} size={22} /> : <Avatar user={assignee} size={22} />}
<h3 style={{
margin: 0, fontSize: 15.5, fontWeight: 600, color: HS.ink,
fontFamily: HS.fontUI, letterSpacing: -0.1, flex: 1,
overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
}}>{task.name}</h3>
</div>
<TaskMeta task={task} room={room} />
</div>
<button
onPointerDown={begin}
onPointerUp={end}
onPointerLeave={end}
onPointerCancel={end}
style={{
flexShrink: 0, border: 'none', background: 'transparent',
padding: '0 14px', cursor: 'pointer', display: 'flex', alignItems: 'center',
position: 'relative',
}}
>
<div style={{
width: 48, height: 48, borderRadius: '50%',
background: done ? HS.sage : HS.bgSunken,
display: 'flex', alignItems: 'center', justifyContent: 'center',
position: 'relative', transition: 'background .2s',
}}>
<svg width={48} height={48} style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
<circle cx="24" cy="24" r="21" fill="none" stroke={HS.sage} strokeWidth="3"
strokeDasharray={2 * Math.PI * 21}
strokeDashoffset={2 * Math.PI * 21 * (1 - progress)}
strokeLinecap="round"
style={{ transition: progress === 0 ? 'stroke-dashoffset .25s ease' : 'none' }}
/>
</svg>
<Icon name="check" size={22} color={done ? '#fff' : HS.ink3} strokeWidth={3} />
</div>
</button>
{!done && progress === 0 && (
<div style={{
position: 'absolute', right: 14, bottom: 6,
fontSize: 9, color: HS.ink3, fontFamily: HS.fontUI, fontWeight: 600,
textTransform: 'uppercase', letterSpacing: 0.5,
}}>Tieni premuto</div>
)}
<Confetti show={burst} originX={0.88} originY={0.5} />
</div>
);
}

function TaskCard(props) {
const { variant = 'tap' } = props;
if (variant === 'swipe') return <TaskCardSwipe {...props} />;
if (variant === 'hold' || variant === 'longpress') return <TaskCardHold {...props} />;
return <TaskCardTap {...props} />;
}

Object.assign(window, { TaskCard, TaskCardTap, TaskCardSwipe, TaskCardHold, URGENCY_STYLES });
