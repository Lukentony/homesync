// Settings screen — vacation, members, notifications, rooms CRUD, scoring rules, quick actions CRUD

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function SettingsScreen({ vacation, setVacation, rooms, setRooms, scoring, setScoring, members, setMembers, onEditMember, notifyPrefs, setNotifyPrefs, prefs, setPrefs, notifSaveState, onInvite, onShowHistory, onReset, tasks = [], completed = [], homeMode, setHomeMode, cardVariant, setCardVariant, onCreateRoom, onUpdateRoom, onDeleteRoom, onCreateTask, onUpdateTask, onDeleteTask }) {
const [roomEdit, setRoomEdit] = React.useState(null); // id or 'new'
const [quickActionEdit, setQuickActionEdit] = React.useState(false);
const [editingQA, setEditingQA] = React.useState(null);

const meId = parseInt(localStorage.getItem('hs-me-id') || '1');
const userMe = members.find(u => u.id === meId) || members[0];

const [pinInput, setPinInput] = React.useState('');
const [morningTime, setMorningTime] = React.useState(userMe?.notification_morning_time || '08:00');
const [eveningTime, setEveningTime] = React.useState(userMe?.notification_evening_time || '20:00');
const [pushEnabled, setPushEnabled] = React.useState(false);
const [isSubscribing, setIsSubscribing] = React.useState(false);

React.useEffect(() => {
  if (userMe) {
    setMorningTime(userMe.notification_morning_time || '08:00');
    setEveningTime(userMe.notification_evening_time || '20:00');
  }
}, [userMe]);

React.useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(reg => {
      reg.pushManager.getSubscription().then(sub => {
        setPushEnabled(!!sub);
      });
    });
  }
}, []);

const handleSavePin = () => {
  if (pinInput !== '' && pinInput.length !== 4) {
    if (window.showToast) window.showToast('Il PIN deve essere di 4 cifre', 'error');
    return;
  }
  window.HS_API.patchUser(meId, { pin: pinInput })
    .then(() => {
      if (window.showToast) window.showToast('PIN aggiornato con successo!');
      setPinInput('');
    })
    .catch(err => {
      if (window.showToast) window.showToast(err.detail || 'Errore salvataggio PIN', 'error');
    });
};

const handleMorningTimeChange = (val) => {
  setMorningTime(val);
  window.HS_API.patchUser(meId, { notification_morning_time: val })
    .then(() => {
      setMembers(members.map(m => m.id === meId ? { ...m, notification_morning_time: val } : m));
    })
    .catch(() => {});
};

const handleEveningTimeChange = (val) => {
  setEveningTime(val);
  window.HS_API.patchUser(meId, { notification_evening_time: val })
    .then(() => {
      setMembers(members.map(m => m.id === meId ? { ...m, notification_evening_time: val } : m));
    })
    .catch(() => {});
};

const handleTogglePush = async (enable) => {
  if (enable) {
    setIsSubscribing(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        if (window.showToast) window.showToast('Permesso notifiche negato', 'error');
        setPushEnabled(false);
        setIsSubscribing(false);
        return;
      }
      const keysRes = await window.HS_API.getVapidPublicKey();
      if (!keysRes || !keysRes.public_key) {
        throw new Error('Chiave pubblica VAPID non trovata');
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keysRes.public_key)
      });
      await window.HS_API.patchUser(meId, { push_subscription: JSON.stringify(sub) });
      setPushEnabled(true);
      if (window.showToast) window.showToast('Notifiche push abilitate su questo dispositivo!');
    } catch (err) {
      console.error('Failed to subscribe to push', err);
      if (window.showToast) window.showToast('Errore abilitazione push', 'error');
      setPushEnabled(false);
    }
    setIsSubscribing(false);
  } else {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
      }
      await window.HS_API.patchUser(meId, { push_subscription: "" });
      setPushEnabled(false);
      if (window.showToast) window.showToast('Notifiche push disabilitate');
    } catch (err) {
      console.error('Failed to unsubscribe', err);
    }
  }
};

const quickActions = tasks.filter(t => t.is_quick_action === true);

return (
<div style={{ padding: '10px 18px 140px' }}>
<h2 style={{ margin: '2px 0 14px', fontFamily: HS.fontDisplay, fontSize: 32, color: HS.ink, fontWeight: 500, letterSpacing: -1 }}>Impostazioni</h2>

{/* Vista & Interazione */}
<SectionLabel>Vista home & interazione</SectionLabel>
<div style={{ background: HS.card, borderRadius: HS.r.lg, boxShadow: HS.shadow.card, padding: '14px 14px 16px', marginBottom: 14 }}>
<div style={{ fontFamily: HS.fontUI, fontSize: 12, color: HS.ink3, fontWeight: 600, marginBottom: 10 }}>LAYOUT HOME</div>
<div style={{ display: 'flex', background: HS.bgSunken, borderRadius: 10, padding: 3, gap: 2, marginBottom: 16 }}>
{[{id:'dial',l:'Dial'},{id:'channels',l:'Lista'}].map(m => (
<button key={m.id} onClick={() => setHomeMode && setHomeMode(m.id)}
style={{
flex: 1, border: 'none', padding: '8px 12px', borderRadius: 7, cursor: 'pointer',
background: homeMode === m.id ? HS.primary : 'transparent',
boxShadow: homeMode === m.id ? HS.shadow.card : 'none',
fontFamily: HS.fontUI, fontSize: 13, fontWeight: 700,
color: homeMode === m.id ? '#fff' : HS.ink3,
}}>{"Dial" === m.l ? "Quadrante" : m.l}</button>
))}
</div>
<div style={{ fontFamily: HS.fontUI, fontSize: 12, color: HS.ink3, fontWeight: 600, marginBottom: 10 }}>MODALITÀ COMPLETAMENTO TASK</div>
<div style={{ display: 'flex', background: HS.bgSunken, borderRadius: 10, padding: 3, gap: 2 }}>
{[{id:'tap',l:'Tap'},{id:'swipe',l:'Swipe'},{id:'hold',l:'Hold'}].map(v => (
<button key={v.id} onClick={() => setCardVariant && setCardVariant(v.id)}
style={{
flex: 1, border: 'none', padding: '8px 10px', borderRadius: 7, cursor: 'pointer',
background: cardVariant === v.id ? HS.ink : 'transparent',
boxShadow: cardVariant === v.id ? HS.shadow.card : 'none',
fontFamily: HS.fontUI, fontSize: 13, fontWeight: 700,
color: cardVariant === v.id ? '#fff' : HS.ink3,
}}>{"Tap" === v.l ? "Tocco" : "Hold" === v.l ? "Pressione" : v.l}</button>
))}
</div>
</div>

{/* Vacation */}
<div style={{
background: vacation ? HS.soonSoft : HS.card, borderRadius: HS.r.lg,
padding: 16, boxShadow: HS.shadow.card, marginBottom: 14,
border: vacation ? `1px solid ${HS.soon}50` : 'none',
}}>
<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
<div style={{
width: 44, height: 44, borderRadius: 12,
background: vacation ? HS.soon : HS.bgSunken,
color: vacation ? '#fff' : HS.ink2,
display: 'flex', alignItems: 'center', justifyContent: 'center',
}}>
<Icon name="plane" size={22} color={vacation ? '#fff' : HS.ink2} strokeWidth={2} />
</div>
<div style={{ flex: 1 }}>
<div style={{ fontFamily: HS.fontUI, fontSize: 15, fontWeight: 700, color: HS.ink }}>Modalità vacanza</div>
<div style={{ fontFamily: HS.fontUI, fontSize: 12, color: HS.ink2, marginTop: 2 }}>
{vacation ? 'Le scadenze sono congelate' : 'Metti in pausa le scadenze'}
</div>
</div>
<Toggle on={vacation} onChange={setVacation} />
</div>
</div>

{/* Members */}
<SectionLabel>Membri della casa</SectionLabel>
<div style={{ background: HS.card, borderRadius: HS.r.lg, boxShadow: HS.shadow.card, overflow: 'hidden', marginBottom: 14 }}>
{(members || MOCK.users).map((u, i, arr) => (
<div key={u.id} style={{
display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
borderBottom: i < arr.length - 1 ? `1px solid ${HS.hairline}` : 'none',
}}>
<Avatar user={u} size={38} />
<div style={{ flex: 1 }}>
<div style={{ fontFamily: HS.fontUI, fontSize: 14.5, fontWeight: 600, color: HS.ink }}>{u.name}</div>
<div style={{ fontFamily: HS.fontUI, fontSize: 11, color: HS.ink3 }}>{u.total || 0} punti totali</div>
</div>
<button onClick={() => onEditMember && onEditMember(u)}
style={{ border: 'none', background: HS.bgSunken, borderRadius: 8, padding: 8, cursor: 'pointer' }}>
<Icon name="edit" size={15} color={HS.ink2} />
</button>
</div>
))}
</div>

{/* Rooms CRUD */}
<SectionLabel>Stanze</SectionLabel>
<div style={{ background: HS.card, borderRadius: HS.r.lg, boxShadow: HS.shadow.card, overflow: 'hidden', marginBottom: 14 }}>
{rooms.map((r, i) => {
const stats = roomStats(r.id, tasks, completed);
return (
<div key={r.id} style={{
display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
borderBottom: i < rooms.length - 1 ? `1px solid ${HS.hairline}` : 'none',
}}>
<div style={{
width: 36, height: 36, borderRadius: 10,
background: r.color + '22', color: r.color,
display: 'flex', alignItems: 'center', justifyContent: 'center',
}}>
<Icon name={roomIcon(r.icon)} size={17} color={r.color} strokeWidth={2} />
</div>
<div style={{ flex: 1 }}>
<div style={{ fontFamily: HS.fontUI, fontSize: 14.5, fontWeight: 600, color: HS.ink }}>{r.name}</div>
<div style={{ fontFamily: HS.fontUI, fontSize: 11, color: HS.ink3 }}>{stats.total} task totali · {stats.done} fatti</div>
</div>
<button onClick={() => setRoomEdit(r.id)} style={{ border: 'none', background: HS.bgSunken, borderRadius: 8, padding: 8, cursor: 'pointer' }}>
<Icon name="edit" size={15} color={HS.ink2} />
</button>
<button onClick={() => onDeleteRoom && onDeleteRoom(r)} style={{ border: 'none', background: HS.urgentSoft, borderRadius: 8, padding: 8, cursor: 'pointer' }}>
<Icon name="trash" size={15} color={HS.urgentInk} />
</button>
</div>
);
})}
<button onClick={() => setRoomEdit('new')} style={{
width: '100%', border: 'none', background: 'transparent',
padding: '14px', cursor: 'pointer', color: HS.primary,
fontFamily: HS.fontUI, fontSize: 13.5, fontWeight: 700,
display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
borderTop: `1px solid ${HS.hairline}`,
}}>
<Icon name="plus" size={16} color={HS.primary} strokeWidth={2.5} /> Aggiungi stanza
</button>
</div>

{/* Creazioni Rapide */}
<SectionLabel>Creazioni Rapide (On-Demand)</SectionLabel>
<div style={{ background: HS.card, borderRadius: HS.r.lg, boxShadow: HS.shadow.card, overflow: 'hidden', marginBottom: 14 }}>
  {quickActions.length === 0 ? (
    <div style={{ padding: '16px', textAlign: 'center', fontSize: 13, color: HS.ink3, fontFamily: HS.fontUI }}>
      Nessuna creazione rapida attiva.
    </div>
  ) : (
    quickActions.map((qa, i) => {
      const emojiMatch = String(qa.name).match(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF]|\uD83D[\uDE00-\uDE4F]|\uD83E[\uDD00-\uDFFF])/);
      const emoji = emojiMatch ? emojiMatch[1] : '⚡';
      const cleanName = String(qa.name).replace(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF]|\uD83D[\uDE00-\uDE4F]|\uD83E[\uDD00-\uDFFF])\s*/, '');
      return (
        <div key={qa.id} style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
          borderBottom: i < quickActions.length - 1 ? `1px solid ${HS.hairline}` : 'none',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: HS.bgSunken, fontSize: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{emoji}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: HS.fontUI, fontSize: 14.5, fontWeight: 600, color: HS.ink }}>{cleanName}</div>
            <div style={{ fontFamily: HS.fontUI, fontSize: 11, color: HS.sageInk }}>+{qa.points || (qa.difficulty * (scoring?.base || 3)) || 6} punti</div>
          </div>
          <button onClick={() => setEditingQA(qa)} style={{ border: 'none', background: HS.bgSunken, borderRadius: 8, padding: 8, cursor: 'pointer', marginRight: 4 }}>
            <Icon name="edit" size={15} color={HS.ink2} />
          </button>
          <button onClick={() => onDeleteTask && onDeleteTask(qa)} style={{ border: 'none', background: HS.urgentSoft, borderRadius: 8, padding: 8, cursor: 'pointer' }}>
            <Icon name="trash" size={15} color={HS.urgentInk} />
          </button>
        </div>
      );
    })
  )}
  <button onClick={() => setQuickActionEdit(true)} style={{
    width: '100%', border: 'none', background: 'transparent',
    padding: '14px', cursor: 'pointer', color: HS.primary,
    fontFamily: HS.fontUI, fontSize: 13.5, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderTop: `1px solid ${HS.hairline}`,
  }}>
    <Icon name="plus" size={16} color={HS.primary} strokeWidth={2.5} /> Aggiungi rapido
  </button>
</div>

{/* Scoring */}
<SectionLabel>Punteggi & regole</SectionLabel>
<div style={{ background: HS.card, borderRadius: HS.r.lg, boxShadow: HS.shadow.card, overflow: 'hidden', marginBottom: 14, padding: '14px 14px 18px' }}>
<div style={{ fontFamily: HS.fontUI, fontSize: 12.5, color: HS.ink2, marginBottom: 14, lineHeight: 1.5 }}>
Personalizza come vengono calcolati i punti per ogni task completato.
</div>

<ScoreSlider label="Punti base per task" value={scoring.base} setValue={(v) => setScoring({ ...scoring, base: v })} min={1} max={10} suffix="pt" />
<div style={{ fontFamily: HS.fontUI, fontSize: 11, color: HS.ink3, marginTop: -8, marginBottom: 12, lineHeight: 1.4 }}>
  Determina il valore base (difficoltà Facile). Medio vale il doppio (2x), Difficile il triplo (3x).<br/>
  <span style={{ fontWeight: 600, color: HS.primary }}>
    Attualmente: Facile = {scoring.base} pt | Medio = {scoring.base * 2} pt | Difficile = {scoring.base * 3} pt
  </span>
</div>
<ScoreSlider label="Bonus task scaduti" value={scoring.overdueBonus} setValue={(v) => setScoring({ ...scoring, overdueBonus: v })} min={0} max={5} suffix="pt" />

<div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10, padding: '12px 0 0', borderTop: `1px solid ${HS.hairline}` }}>
<div style={{ flex: 1 }}>
<div style={{ fontFamily: HS.fontUI, fontSize: 14, fontWeight: 600, color: HS.ink }}>Dividi punti task condivisi</div>
<div style={{ fontFamily: HS.fontUI, fontSize: 11, color: HS.ink3 }}>Se "Insieme", metà punti a testa</div>
</div>
<Toggle on={scoring.splitShared} onChange={(v) => setScoring({ ...scoring, splitShared: v })} />
</div>
</div>

{/* Preferences */}
<SectionLabel>Preferenze</SectionLabel>
<div style={{ background: HS.card, borderRadius: HS.r.lg, boxShadow: HS.shadow.card, overflow: 'hidden', marginBottom: 14, padding: '14px 14px 18px' }}>
<div style={{ fontFamily: HS.fontUI, fontSize: 12.5, color: HS.ink2, marginBottom: 14, lineHeight: 1.5 }}>
Personalizza la visualizzazione e le scadenze.
</div>

<div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, marginBottom: 12 }}>
<div style={{ flex: 1 }}>
<div style={{ fontFamily: HS.fontUI, fontSize: 14, fontWeight: 600, color: HS.ink }}>Colori urgenza nel calendario</div>
<div style={{ fontFamily: HS.fontUI, fontSize: 11, color: HS.ink3 }}>Mostra colori per scaduto/urgente/ok</div>
</div>
<Toggle on={prefs?.show_urgency_colors === 'true'} onChange={(v) => setPrefs({ ...prefs, show_urgency_colors: v ? 'true' : 'false' })} />
</div>

<ScoreSlider label="Scadenza anticipata (giorni)" value={parseInt(prefs?.early_completion_days || '2')} setValue={(v) => setPrefs({ ...prefs, early_completion_days: String(v) })} min={0} max={7} suffix="gg" />
<ScoreSlider label="Giorni di grazia" value={parseInt(prefs?.grace_period_days || '1')} setValue={(v) => setPrefs({ ...prefs, grace_period_days: String(v) })} min={0} max={5} suffix="gg" />
</div>

{/* Sicurezza & PIN */}
<SectionLabel>Sicurezza & PIN</SectionLabel>
<div style={{ background: HS.card, borderRadius: HS.r.lg, boxShadow: HS.shadow.card, padding: 16, marginBottom: 14 }}>
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    <div style={{ fontFamily: HS.fontUI, fontSize: 14, fontWeight: 700, color: HS.ink }}>PIN di sblocco</div>
    <div style={{ fontSize: 12, color: HS.ink2 }}>Imposta un PIN numerico di 4 cifre per proteggere l'accesso al tuo profilo su questo ed altri dispositivi. Lascia vuoto per disabilitarlo.</div>
    <div style={{ display: 'flex', gap: 10 }}>
      <input
        type="password"
        maxLength={4}
        placeholder="Nessun PIN"
        value={pinInput}
        onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
        style={{
          flex: 1, border: `1px solid ${HS.hairline}`, background: HS.bgSunken,
          borderRadius: 10, padding: '12px 14px', fontFamily: HS.fontUI, fontSize: 14,
          fontWeight: 600, color: HS.ink, outline: 'none'
        }}
      />
      <button
        onClick={handleSavePin}
        style={{
          border: 'none', background: HS.primary, color: '#fff',
          padding: '0 20px', borderRadius: 10, fontFamily: HS.fontUI, fontSize: 13,
          fontWeight: 700, cursor: 'pointer'
        }}
      >Salva</button>
    </div>
  </div>
</div>

{/* Notifications */}
<SectionLabel>Notifiche push native</SectionLabel>
<div style={{ background: HS.card, borderRadius: HS.r.lg, boxShadow: HS.shadow.card, overflow: 'hidden', marginBottom: 14 }}>
  <ToggleRow
    label="Abilita notifiche push"
    sub="Attiva i promemoria su questo dispositivo"
    on={pushEnabled}
    onChange={handleTogglePush}
    disabled={isSubscribing}
  />
  
  <div style={{ padding: '14px', borderTop: `1px solid ${HS.hairline}`, display: 'flex', flexDirection: 'column', gap: 12 }}>
    <div style={{ fontFamily: HS.fontUI, fontSize: 13, fontWeight: 700, color: HS.ink }}>Orari dei promemoria</div>
    
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontFamily: HS.fontUI, fontSize: 13, color: HS.ink2 }}>Promemoria Mattutino</span>
      <input
        type="time"
        value={morningTime}
        onChange={(e) => handleMorningTimeChange(e.target.value)}
        style={{
          border: 'none', background: HS.bgSunken, borderRadius: 8, padding: '6px 10px',
          fontFamily: HS.fontUI, fontSize: 13, fontWeight: 600, color: HS.ink, outline: 'none'
        }}
      />
    </div>

    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
      <span style={{ fontFamily: HS.fontUI, fontSize: 13, color: HS.ink2 }}>Promemoria Serale</span>
      <input
        type="time"
        value={eveningTime}
        onChange={(e) => handleEveningTimeChange(e.target.value)}
        style={{
          border: 'none', background: HS.bgSunken, borderRadius: 8, padding: '6px 10px',
          fontFamily: HS.fontUI, fontSize: 13, fontWeight: 600, color: HS.ink, outline: 'none'
        }}
      />
    </div>
  </div>
</div>

{/* Reset */}
<div style={{ background: HS.card, borderRadius: HS.r.lg, boxShadow: HS.shadow.card, overflow: 'hidden' }}>
<InfoRow icon="trash" label="Ripristina dati di default" chev onClick={onReset} danger last />
</div>

{/* Room edit sheet */}
<RoomEditSheet
open={!!roomEdit}
room={roomEdit === 'new' ? null : rooms.find(r => r.id === roomEdit)}
onClose={() => setRoomEdit(null)}
onSave={(r) => {
if (roomEdit === 'new') onCreateRoom && onCreateRoom(r);
else onUpdateRoom && onUpdateRoom(r);
setRoomEdit(null);
}}
/>

{/* Quick Action create sheet */}
<QuickActionEditSheet
open={quickActionEdit}
onClose={() => setQuickActionEdit(false)}
onSave={(qa) => {
if (onCreateTask) {
  onCreateTask({
    name: qa.emoji + " " + qa.name,
    roomId: 1,
    every: 9999,
    assignee: 'both',
    initial_due_date: '9999-12-31',
    is_quick_action: true,
    difficulty: qa.difficulty || 2,
    tags: JSON.stringify(['room:1'])
  });
}
setQuickActionEdit(false);
}}
/>

{/* Quick Action edit sheet */}
<QuickActionEditSheet
open={!!editingQA}
initialData={editingQA}
onClose={() => setEditingQA(null)}
onSave={(qa) => {
if (editingQA && onUpdateTask) {
  const bid = editingQA._backendId || editingQA.id;
  onUpdateTask(bid, {
    name: qa.emoji + " " + qa.name,
    room_id: editingQA.room_id || 1,
    frequency_days: 9999,
    assignment_type: 'ANY',
    difficulty: qa.difficulty || 2,
    is_quick_action: true,
    tags: JSON.stringify(['room:' + (editingQA.room_id || 1)])
  });
}
setEditingQA(null);
}}
/>
</div>
);
}

function ScoreSlider({ label, value, setValue, min, max, suffix = '' }) {
return (
<div style={{ marginBottom: 14 }}>
<div style={{ display: 'flex', alignItems: 'center', justifycontent: 'space-between', marginBottom: 6 }}>
<div style={{ fontFamily: HS.fontUI, fontSize: 13.5, fontWeight: 600, color: HS.ink }}>{label}</div>
<div style={{
fontFamily: HS.fontDisplay, fontSize: 18, fontWeight: 500, color: HS.primary,
letterSpacing: -0.3,
}}>{value}<span style={{ fontSize: 11, fontFamily: HS.fontUI, color: HS.ink3, fontWeight: 600, marginLeft: 2 }}>{suffix}</span></div>
</div>
<input type="range" min={min} max={max} value={value} onChange={(e) => setValue(+e.target.value)}
style={{ width: '100%', accentColor: HS.primary }} />
</div>
);
}

function RoomEditSheet({ open, room, onClose, onSave }) {
const ICONS = [
{ id: 'Utensils', label: 'Cucina', color: '#E2743A' },
{ id: 'Bath', label: 'Bagno', color: '#6F9E7A' },
{ id: 'BedDouble', label: 'Camera', color: '#8C5AC8' },
{ id: 'Sofa', label: 'Soggiorno', color: '#E0A93A' },
{ id: 'WashingMachine', label: 'Lavanderia', color: '#D94B4B' },
{ id: 'Flower2', label: 'Balcone', color: '#6F9E7A' },
];
const [name, setName] = React.useState('');
const [icon, setIcon] = React.useState('Utensils');
const [color, setColor] = React.useState('#E2743A');

React.useEffect(() => {
if (open) {
setName(room?.name || '');
setIcon(room?.icon || 'Utensils');
setColor(room?.color || '#E2743A');
}
}, [open, room]);

if (!open) return null;
const COLORS = ['#E2743A', '#6F9E7A', '#8C5AC8', '#E0A93A', '#D94B4B', '#3B82AE'];

return (
<div style={{
position: 'absolute', inset: 0, zIndex: 55,
background: 'rgba(42,29,20,0.5)', backdropFilter: 'blur(3px)',
display: 'flex', alignItems: 'flex-end',
animation: 'hs-fade 180ms ease',
}} onClick={onClose}>
<div onClick={(e) => e.stopPropagation()} style={{
background: HS.bg, width: '100%',
borderTopLeftRadius: 30, borderTopRightRadius: 30,
padding: '14px 20px 28px',
animation: 'hs-slide-up 260ms cubic-bezier(.2,.9,.3,1)',
}}>
<div style={{ width: 40, height: 4, borderRadius: 2, background: HS.hairline, margin: '0 auto 14px' }} />
<h2 style={{ margin: '0 0 14px', fontFamily: HS.fontDisplay, fontSize: 26, fontWeight: 500, color: HS.ink, letterSpacing: -0.5 }}>
{room ? 'Modifica stanza' : 'Nuova stanza'}
</h2>

<label style={{ fontSize: 11, color: HS.ink3, fontFamily: HS.fontUI, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>Nome</label>
<input value={name} onChange={(e) => setName(e.target.value)} placeholder="es. Studio"
style={{
width: '100%', boxSizing: 'border-box',
padding: '14px', marginTop: 6, marginBottom: 14,
border: 'none', background: HS.card, borderRadius: HS.r.md,
boxShadow: HS.shadow.card, fontFamily: HS.fontUI, fontSize: 15, color: HS.ink,
outline: 'none',
}} />

<label style={{ fontSize: 11, color: HS.ink3, fontFamily: HS.fontUI, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>Icona</label>
<div style={{ display: 'flex', gap: 8, marginTop: 6, marginBottom: 14, flexWrap: 'wrap' }}>
{ICONS.map(i => (
<button key={i.id} onClick={() => setIcon(i.id)} style={{
border: 'none', cursor: 'pointer',
width: 54, height: 54, borderRadius: 14,
background: icon === i.id ? color + '22' : HS.card,
boxShadow: HS.shadow.card,
outline: icon === i.id ? `2px solid ${color}` : 'none',
display: 'flex', alignItems: 'center', justifyContent: 'center',
}}>
<Icon name={roomIcon(i.id)} size={22} color={icon === i.id ? color : HS.ink2} strokeWidth={2} />
</button>
))}
</div>

<label style={{ fontSize: 11, color: HS.ink3, fontFamily: HS.fontUI, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>Colore</label>
<div style={{ display: 'flex', gap: 10, marginTop: 6, marginBottom: 20 }}>
{COLORS.map(c => (
<button key={c} onClick={() => setColor(c)} style={{
border: 'none', cursor: 'pointer',
width: 40, height: 40, borderRadius: '50%', background: c,
boxShadow: color === c ? `0 0 0 3px ${HS.bg}, 0 0 0 5px ${c}` : HS.shadow.card,
}} />
))}
</div>

<button onClick={() => name.trim() && onSave({ ...(room || {}), name, icon, color })}
disabled={!name.trim()}
style={{
width: '100%', padding: '16px', border: 'none',
cursor: name.trim() ? 'pointer' : 'default',
borderRadius: HS.r.md, fontFamily: HS.fontUI, fontSize: 15, fontWeight: 700,
background: name.trim() ? HS.primary : HS.bgSunken,
color: name.trim() ? '#fff' : HS.ink3,
boxShadow: name.trim() ? HS.shadow.fab : 'none',
}}>
{room ? 'Salva modifiche' : 'Crea stanza'}
</button>
</div>
</div>
);
}

function QuickActionEditSheet({ open, initialData, onClose, onSave }) {
  const isEdit = !!initialData;
  const [name, setName] = React.useState('');
  const [emoji, setEmoji] = React.useState('⚡');
  const [difficulty, setDifficulty] = React.useState(2);

  React.useEffect(() => {
    if (open) {
      if (initialData) {
        const emojiMatch = String(initialData.name || '').match(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF]|\uD83D[\uDE00-\uDE4F]|\uD83E[\uDD00-\uDFFF])/);
        setEmoji(emojiMatch ? emojiMatch[1] : '⚡');
        setName(String(initialData.name || '').replace(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF]|\uD83D[\uDE00-\uDE4F]|\uD83E[\uDD00-\uDFFF])\s*/, ''));
        setDifficulty(initialData.difficulty || 2);
      } else {
        setName('');
        setEmoji('⚡');
        setDifficulty(2);
      }
    }
  }, [open, initialData]);

  if (!open) return null;
  const EMOJIS = ['⚡', '🧼', '👕', '🗑️', '🍽️', '🧹', '🪴', '🚿', '🐾', '📦'];
  const DIFF_OPTS = [{ v: 1, l: 'Facile', m: '1×' }, { v: 2, l: 'Medio', m: '2×' }, { v: 3, l: 'Difficile', m: '3×' }];

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 55,
      background: 'rgba(42,29,20,0.5)', backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'flex-end',
      animation: 'hs-fade 180ms ease',
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: HS.bg, width: '100%',
        borderTopLeftRadius: 30, borderTopRightRadius: 30,
        padding: '14px 20px 28px',
        animation: 'hs-slide-up 260ms cubic-bezier(.2,.9,.3,1)',
      }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: HS.hairline, margin: '0 auto 14px' }} />
        <h2 style={{ margin: '0 0 14px', fontFamily: HS.fontDisplay, fontSize: 26, fontWeight: 500, color: HS.ink, letterSpacing: -0.5 }}>
          {isEdit ? 'Modifica rapido' : 'Nuovo compito rapido'}
        </h2>

        <label style={{ fontSize: 11, color: HS.ink3, fontFamily: HS.fontUI, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>Nome azione</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="es. Lavare tazzine"
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '14px', marginTop: 6, marginBottom: 14,
            border: 'none', background: HS.card, borderRadius: HS.r.md,
            boxShadow: HS.shadow.card, fontFamily: HS.fontUI, fontSize: 15, color: HS.ink,
            outline: 'none',
          }} />

        <label style={{ fontSize: 11, color: HS.ink3, fontFamily: HS.fontUI, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>Emoji</label>
        <div style={{ display: 'flex', gap: 10, marginTop: 6, marginBottom: 14, flexWrap: 'wrap' }}>
          {EMOJIS.map(e => (
            <button key={e} onClick={() => setEmoji(e)} style={{
              border: 'none', cursor: 'pointer', fontSize: 22,
              width: 44, height: 44, borderRadius: '50%', background: emoji === e ? HS.primarySoft : HS.card,
              boxShadow: emoji === e ? `0 0 0 2px ${HS.primary}` : HS.shadow.card,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>{e}</button>
          ))}
        </div>

        <label style={{ fontSize: 11, color: HS.ink3, fontFamily: HS.fontUI, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>Difficolta</label>
        <div style={{ display: 'flex', gap: 8, marginTop: 6, marginBottom: 20 }}>
          {DIFF_OPTS.map(d => (
            <button key={d.v} onClick={() => setDifficulty(d.v)} style={{
              flex: 1, border: 'none', padding: '10px 6px', borderRadius: 10, cursor: 'pointer',
              background: difficulty === d.v ? HS.ink : HS.card,
              color: difficulty === d.v ? '#fff' : HS.ink2,
              boxShadow: HS.shadow.card,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            }}>
              <span style={{ fontFamily: HS.fontUI, fontSize: 13, fontWeight: 700 }}>{d.l}</span>
              <span style={{ fontFamily: HS.fontUI, fontSize: 10, opacity: 0.7 }}>{d.m} base</span>
            </button>
          ))}
        </div>

        <button onClick={() => name.trim() && onSave({ name, emoji, difficulty })}
          disabled={!name.trim()}
          style={{
            width: '100%', padding: '16px', border: 'none',
            cursor: name.trim() ? 'pointer' : 'default',
            borderRadius: HS.r.md, fontFamily: HS.fontUI, fontSize: 15, fontWeight: 700,
            background: name.trim() ? HS.primary : HS.bgSunken,
            color: name.trim() ? '#fff' : HS.ink3,
            boxShadow: name.trim() ? HS.shadow.fab : 'none',
          }}>
          {isEdit ? 'Salva modifiche' : 'Crea azione rapida'}
        </button>
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
return (
<div style={{
fontFamily: HS.fontUI, fontSize: 11, color: HS.ink3, fontWeight: 700,
textTransform: 'uppercase', letterSpacing: 1.2, padding: '8px 4px',
}}>{children}</div>
);
}

function Toggle({ on, onChange }) {
return (
<button onClick={() => onChange(!on)} style={{
width: 46, height: 28, borderRadius: 999, border: 'none', cursor: 'pointer',
background: on ? HS.sage : HS.hairline, position: 'relative',
transition: 'background .2s',
}}>
<span style={{
position: 'absolute', top: 2, left: on ? 20 : 2, width: 24, height: 24,
borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
transition: 'left .2s',
}} />
</button>
);
}

function ToggleRow({ label, sub, on, onChange, last }) {
return (
<div style={{
display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
borderBottom: last ? 'none' : `1px solid ${HS.hairline}`,
}}>
<div style={{ flex: 1 }}>
<div style={{ fontFamily: HS.fontUI, fontSize: 14, fontWeight: 600, color: HS.ink }}>{label}</div>
{sub && <div style={{ fontFamily: HS.fontUI, fontSize: 11.5, color: HS.ink3, marginTop: 1 }}>{sub}</div>}
</div>
<Toggle on={on} onChange={onChange} />
</div>
);
}

function InfoRow({ icon, label, value, chev, last, onClick, danger }) {
return (
<div onClick={onClick} style={{
display: 'flex', alignItems: 'center', gap: 12, padding: '14px',
borderBottom: last ? 'none' : `1px solid ${HS.hairline}`,
cursor: onClick || chev ? 'pointer' : 'default',
}}>
<Icon name={icon} size={18} color={danger ? HS.urgentInk : HS.ink2} strokeWidth={2} />
<div style={{ flex: 1, fontFamily: HS.fontUI, fontSize: 14, fontWeight: 500, color: danger ? HS.urgentInk : HS.ink }}>{label}</div>
{value && <div style={{ fontFamily: HS.fontUI, fontSize: 12, color: HS.ink3 }}>{value}</div>}
{chev && <Icon name="chevron" size={16} color={HS.ink3} />}
</div>
);
}

Object.assign(window, { SettingsScreen, Toggle });
