// Member edit bottom sheet — name, emoji, color

function MemberEditSheet({ open, member, onClose, onSave }) {
  const [name, setName] = React.useState('');
  const [emoji, setEmoji] = React.useState('🦊');
  const [color, setColor] = React.useState('#E2743A');

  React.useEffect(() => {
    if (open && member) {
      setName(member.name || '');
      setEmoji(member.emoji || '🦊');
      setColor(member.color || '#E2743A');
    }
  }, [open, member]);

  if (!open || !member) return null;
  const EMOJIS = ['🦊','🐻','🐼','🐨','🦁','🐯','🐶','🐱','🐸','🐧','🐰','🦉','🦄','🐢','🐙'];
  const COLORS = ['#E2743A', '#6F9E7A', '#8C5AC8', '#E0A93A', '#D94B4B', '#3B82AE', '#D96CAD'];

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 60,
      background: 'rgba(42,29,20,0.52)', backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'flex-end',
      animation: 'hs-fade 180ms ease',
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: HS.bg, width: '100%',
        borderTopLeftRadius: 30, borderTopRightRadius: 30,
        padding: '14px 20px 28px', maxHeight: '92%', overflow: 'auto',
        animation: 'hs-slide-up 260ms cubic-bezier(.2,.9,.3,1)',
      }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: HS.hairline, margin: '0 auto 14px' }} />
        <h2 style={{ margin: '0 0 14px', fontFamily: HS.fontDisplay, fontSize: 26, fontWeight: 500, color: HS.ink, letterSpacing: -0.5 }}>
          Modifica {member.name}
        </h2>

        {/* Preview */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '18px 0', marginBottom: 14,
          background: color + '15', borderRadius: HS.r.lg,
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 42, boxShadow: `0 0 0 4px ${HS.bg}, 0 0 0 6px ${color}`,
          }}>{emoji}</div>
        </div>

        <label style={{ fontSize: 11, color: HS.ink3, fontFamily: HS.fontUI, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>Nome</label>
        <input value={name} onChange={(e) => setName(e.target.value)}
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '14px', marginTop: 6, marginBottom: 14,
            border: 'none', background: HS.card, borderRadius: HS.r.md,
            boxShadow: HS.shadow.card, fontFamily: HS.fontUI, fontSize: 15, color: HS.ink,
            outline: 'none',
          }} />

        <label style={{ fontSize: 11, color: HS.ink3, fontFamily: HS.fontUI, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>Emoji</label>
        <div style={{ display: 'flex', gap: 6, marginTop: 6, marginBottom: 14, flexWrap: 'wrap' }}>
          {EMOJIS.map(e => (
            <button key={e} onClick={() => setEmoji(e)} style={{
              border: 'none', cursor: 'pointer',
              width: 44, height: 44, borderRadius: 12, fontSize: 22,
              background: emoji === e ? color + '22' : HS.card,
              boxShadow: HS.shadow.card,
              outline: emoji === e ? `2px solid ${color}` : 'none',
            }}>{e}</button>
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

        <button onClick={() => name.trim() && onSave({ ...member, name, emoji, color })}
          disabled={!name.trim()}
          style={{
            width: '100%', padding: '16px', border: 'none',
            cursor: name.trim() ? 'pointer' : 'default',
            borderRadius: HS.r.md, fontFamily: HS.fontUI, fontSize: 15, fontWeight: 700,
            background: name.trim() ? HS.primary : HS.bgSunken,
            color: name.trim() ? '#fff' : HS.ink3,
            boxShadow: name.trim() ? HS.shadow.fab : 'none',
          }}>
          Salva modifiche
        </button>
      </div>
    </div>
  );
}

// Full history screen — all completed tasks, filterable by person
function HistoryScreen({ completed, onOpen, onUndo }) {
  const [filter, setFilter] = React.useState('all');
  const list = completed.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'both') return t.completedBy === 'both';
    return t.completedBy === filter;
  });

  const grouped = {};
  list.forEach(t => {
    const d = new Date(t.completedAt || Date.now());
    const key = d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
    (grouped[key] = grouped[key] || []).push(t);
  });

  // CSV export
  const exportCSV = () => {
    const headers = ['Data', 'Task', 'Utente', 'Punti'];
    const rows = list.map(t => {
      const d = new Date(t.completedAt || Date.now()).toISOString().slice(0, 19).replace('T', ' ');
      const u = MOCK.users.find(x => x.id === t.completedBy);
      return [d, '"' + (t.name || '').replace(/"/g, '""') + '"', '"' + (u?.name || '') + '"', t.awardedPoints || t.points || 0];
    });
    const csv = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'homesync_storico_' + new Date().toISOString().slice(0, 10) + '.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: '10px 18px 140px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <h2 style={{ margin: '2px 0', fontFamily: HS.fontDisplay, fontSize: 32, color: HS.ink, fontWeight: 500, letterSpacing: -1 }}>Storico</h2>
        {list.length > 0 && (
          <button onClick={exportCSV} style={{
            border: 'none', background: HS.bgSunken, borderRadius: 10, padding: '8px 12px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
            fontFamily: HS.fontUI, fontSize: 11, fontWeight: 700, color: HS.ink2,
          }}>
            <Icon name="download" size={14} color={HS.ink2} strokeWidth={2.5} /> CSV
          </button>
        )}
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {[
          { id: 'all', label: 'Tutti' },
          ...MOCK.users.map(u => ({ id: u.id, label: u.name, color: u.color })),
          { id: 'both', label: 'Insieme', color: HS.primary },
        ].map(o => (
          <button key={o.id} onClick={() => setFilter(o.id)} style={{
            border: 'none', padding: '8px 14px', borderRadius: 999, cursor: 'pointer',
            fontFamily: HS.fontUI, fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap',
            background: filter === o.id ? (o.color || HS.ink) : HS.card,
            color: filter === o.id ? '#fff' : HS.ink,
            boxShadow: HS.shadow.card,
          }}>{o.label}</button>
        ))}
      </div>

      {list.length === 0 && (
        <div style={{
          padding: '32px 16px', textAlign: 'center',
          background: HS.card, borderRadius: HS.r.lg, boxShadow: HS.shadow.card,
        }}>
          <div style={{ fontSize: 40, marginBottom: 6 }}>📋</div>
          <div style={{ fontFamily: HS.fontUI, fontSize: 14, color: HS.ink2, fontWeight: 600 }}>Nessun task completato ancora</div>
        </div>
      )}

      {Object.entries(grouped).map(([day, items]) => (
        <div key={day} style={{ marginBottom: 18 }}>
          <div style={{
            fontFamily: HS.fontUI, fontSize: 11, color: HS.ink3, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8,
          }}>{day}</div>
          <div style={{ background: HS.card, borderRadius: HS.r.lg, boxShadow: HS.shadow.card, overflow: 'hidden' }}>
            {items.map((t, i) => {
              const byId = t.completedBy;
              const isBoth = byId === 'both';
              const users = isBoth ? MOCK.users : [MOCK.users.find(u => u.id === byId)].filter(Boolean);
              const time = new Date(t.completedAt || Date.now()).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
              const hpts = t.awardedPoints ?? t.points ?? 0;
              const hneg = hpts < 0;
              return (
                <div key={t.id + i} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', cursor: 'pointer',
                  borderBottom: i < items.length - 1 ? `1px solid ${HS.hairline}` : 'none',
                }}>
                  <div onClick={() => onOpen && onOpen(t)} style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, cursor: 'pointer' }}>
                    {isBoth ? <BothAvatar users={users} size={28} /> : <Avatar user={users[0]} size={32} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontFamily: HS.fontUI, fontSize: 14, fontWeight: 600, color: HS.ink,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>{t.name}</div>
                      <div style={{ fontFamily: HS.fontUI, fontSize: 11, color: HS.ink3, marginTop: 1 }}>
                        {isBoth ? 'Insieme' : (users[0]?.name || '')} · {time}
                      </div>
                    </div>
                    <span style={{
                      padding: '3px 8px', borderRadius: 999, background: hneg ? HS.urgentSoft : HS.sageSoft,
                      fontFamily: HS.fontUI, fontSize: 11, fontWeight: 700, color: hneg ? HS.urgentInk : HS.sageInk,
                    }}>{(window.fmtPoints ? window.fmtPoints(hpts) : (hpts>=0?'+':'')+hpts)} pt</span>
                  </div>
                  {onUndo && (
                    <button onClick={(e) => { e.stopPropagation(); onUndo(t); }}
                      style={{
                        border: 'none', background: HS.urgentSoft, borderRadius: 8, padding: '6px 10px',
                        cursor: 'pointer', fontFamily: HS.fontUI, fontSize: 10, fontWeight: 700, color: HS.urgentInk,
                        whiteSpace: 'nowrap', flexShrink: 0,
                      }}>
                      Annulla
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { MemberEditSheet, HistoryScreen });
