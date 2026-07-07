// Desktop dashboard — ampio, a 3 colonne. Si attiva quando viewport > 1100px.

function DesktopDashboard({ tasks, completed, onComplete, onOpenTask, onAdd, vacation, activeTab, onNavigate, children }) {
  const today = tasks.filter(t => t.urgency === 'overdue' || t.urgency === 'urgent');
  const soon = tasks.filter(t => t.urgency === 'soon');
  const [a, b] = MOCK.users;
  const total = a.weekly + b.weekly;
  const aPct = total ? (a.weekly / total) * 100 : 50;
  const curTab = activeTab || 'today';

  return (
    <div style={{
      width: '100%', height: '100%', display: 'grid',
      gridTemplateColumns: children ? '260px 1fr' : '260px 1fr 340px', gap: 0,
      background: HS.bg, color: HS.ink, fontFamily: HS.fontUI,
    }}>
      {/* Sidebar */}
      <aside style={{
        padding: '28px 20px', borderRight: `1px solid ${HS.hairline}`,
        display: 'flex', flexDirection: 'column', gap: 18,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 11, background: HS.primary, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: HS.fontDisplay, fontWeight: 600, fontSize: 20, boxShadow: HS.shadow.fab,
          }}>H</div>
          <div style={{ fontFamily: HS.fontDisplay, fontSize: 22, fontWeight: 500, letterSpacing: -0.5 }}>HomeSync</div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[
            { id: 'today',    label: 'Oggi',          icon: 'home' },
            { id: 'rooms',    label: 'Stanze',         icon: 'layers' },
            { id: 'calendar', label: 'Calendario',     icon: 'calendar' },
            { id: 'score',    label: 'Punteggi',       icon: 'trophy' },
            { id: 'history',  label: 'Storico',        icon: 'history' },
            { id: 'settings', label: 'Impostazioni',   icon: 'settings' },
          ].map(n => {
            const active = n.id === curTab;
            return (
            <button key={n.id} onClick={() => onNavigate && onNavigate(n.id)} style={{
              border: 'none', cursor: 'pointer', textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 12,
              background: active ? HS.primarySoft : 'transparent',
              color: active ? HS.primaryInk : HS.ink2,
              fontSize: 14, fontWeight: active ? 700 : 500,
            }}>
              <Icon name={n.icon} size={18} strokeWidth={active ? 2.4 : 2} />
              {n.label}
            </button>
            );
          })}
        </nav>

        <button onClick={onAdd} style={{
          marginTop: 'auto', border: 'none', cursor: 'pointer',
          padding: '12px', borderRadius: 12, background: HS.primary, color: '#fff',
          fontSize: 14, fontWeight: 700, boxShadow: HS.shadow.fab,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <Icon name="plus" size={18} color="#fff" strokeWidth={2.8} /> Nuovo task
        </button>

        {/* Members mini */}
        <div style={{ paddingTop: 14, borderTop: `1px solid ${HS.hairline}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: HS.ink3, textTransform: 'uppercase', letterSpacing: 1 }}>In casa</div>
          {MOCK.users.map(u => (
            <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar user={u} size={26} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>{u.name}</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: HS.ink3, fontWeight: 600 }}>{u.weekly} pt</span>
            </div>
          ))}
        </div>
      </aside>

      {/* Main */}
      <main style={{ padding: children ? '0' : '28px 32px', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {children && <div style={{ flex: 1, overflow: 'auto' }}>{children}</div>}
        {!children && <>
        <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', marginBottom: 22 }}>
          <div>
            <div style={{ fontSize: 12, color: HS.ink3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
              {new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
            <h1 style={{
              margin: '4px 0 0', fontFamily: HS.fontDisplay, fontSize: 44, fontWeight: 500,
              letterSpacing: -1.5, color: HS.ink, lineHeight: 1.05,
            }}>
              {today.length === 0 ? 'Tutto fatto, goditi la giornata.' : `${today.length} cose insieme oggi.`}
            </h1>
          </div>
          {vacation && (
            <div style={{
              background: HS.soonSoft, color: HS.soonInk, padding: '8px 14px',
              borderRadius: 999, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <Icon name="plane" size={14} color={HS.soonInk} strokeWidth={2.2} /> Modalità vacanza
            </div>
          )}
        </div>

        {/* Two columns per user */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {MOCK.users.map(u => {
            const mine = today.filter(t => t.assignee === u.id || t.assignee === 'both');
            return (
              <div key={u.id} style={{
                background: HS.card, borderRadius: HS.r.xl, padding: 18,
                boxShadow: HS.shadow.card,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <Avatar user={u} size={40} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: HS.fontDisplay, fontSize: 22, fontWeight: 500, letterSpacing: -0.5 }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: HS.ink3, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Icon name="flame" size={12} color={u.color} strokeWidth={2.4} /> {u.streak}g streak
                    </div>
                  </div>
                  <div style={{
                    padding: '6px 10px', borderRadius: 999,
                    background: u.color + '22', color: u.color,
                    fontSize: 13, fontWeight: 700,
                  }}>{u.weekly} pt</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {mine.length === 0 && (
                    <div style={{
                      padding: 18, borderRadius: HS.r.md, background: HS.bgSunken,
                      textAlign: 'center', fontSize: 13, color: HS.ink3,
                    }}>🎉 Niente da fare</div>
                  )}
                  {mine.map(t => (
                    <div key={t.id + '-' + (t.instance_date || t.next_due_date) + (t._ck ? '-' + t._ck : '')} onClick={() => onOpenTask(t)}>
                      <TaskCard variant="tap" task={t}
                        room={MOCK.rooms.find(r => r.id === t.room)}
                        assignee={u} onComplete={onComplete} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Soon */}
        {soon.length > 0 && (
          <>
            <h3 style={{ margin: '28px 0 12px', fontFamily: HS.fontDisplay, fontSize: 22, fontWeight: 500, letterSpacing: -0.4 }}>In arrivo</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
              {soon.map(t => (
                <TaskCard key={t.id + '-' + (t.instance_date || t.next_due_date) + (t._ck ? '-' + t._ck : '')} variant="tap" task={t}
                  room={MOCK.rooms.find(r => r.id === t.room)}
                  assignee={MOCK.users.find(u => u.id === t.assignee)}
                  onComplete={onComplete}
                  onOpen={onOpenTask} />
              ))}
            </div>
          </>
        )}
        </>}
      </main>

      {/* Right rail — only when showing default today dashboard */}
      {!children && <aside style={{
        padding: '28px 22px', borderLeft: `1px solid ${HS.hairline}`,
        overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        {/* H2H */}
        <div style={{
          background: `linear-gradient(135deg, ${a.color} 0%, ${b.color} 100%)`,
          borderRadius: HS.r.xl, padding: 18, color: '#fff',
        }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, opacity: 0.85, textTransform: 'uppercase', letterSpacing: 1.5 }}>Classifica settimana</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
            {[a, b].map((u, i) => (
              <div key={u.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <Avatar user={u} size={42} />
                <div style={{ fontFamily: HS.fontDisplay, fontSize: 32, fontWeight: 500, letterSpacing: -1, lineHeight: 1 }}>{u.weekly}</div>
                <div style={{ fontSize: 11, fontWeight: 600 }}>{u.name}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, height: 8, background: 'rgba(255,255,255,0.25)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ width: `${aPct}%`, height: '100%', background: '#fff' }} />
          </div>
        </div>

        {/* History */}
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: HS.ink3, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 }}>
            Storico recente
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(completed || []).slice(0, 6).length === 0 && (
              <div style={{ padding: '14px', background: HS.card, borderRadius: 12, boxShadow: HS.shadow.card, fontSize: 12, color: HS.ink3, textAlign: 'center' }}>
                Nessun task completato di recente
              </div>
            )}
            {[...(completed || [])]
              .sort((x, y) => (y.completedAt || 0) - (x.completedAt || 0))
              .slice(0, 6)
              .map(h => {
              const isBoth = h.completedBy === 'both';
              const u = isBoth ? null : MOCK.users.find(x => x.id === h.completedBy);
              const pts = h.awardedPoints ?? h.points ?? 0;
              const neg = pts < 0;
              const rel = (() => {
                const ts = h.completedAt || 0;
                const diff = Date.now() - ts;
                const m = Math.floor(diff / 60000);
                if (m < 1) return 'ora';
                if (m < 60) return `${m}m fa`;
                const hr = Math.floor(m / 60);
                if (hr < 24) return `${hr}h fa`;
                return `${Math.floor(hr / 24)}g fa`;
              })();
              return (
                <div key={h.id + (h.completedAt || '')} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', background: HS.card, borderRadius: 12,
                  boxShadow: HS.shadow.card,
                }}>
                  {isBoth ? <BothAvatar users={MOCK.users} size={26} /> : <Avatar user={u} size={28} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: HS.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.name}</div>
                    <div style={{ fontSize: 11, color: HS.ink3 }}>{isBoth ? 'Insieme' : u?.name} · {rel}</div>
                  </div>
                  <span style={{
                    padding: '3px 8px', borderRadius: 999,
                    background: neg ? HS.urgentSoft : HS.primarySoft, color: neg ? HS.urgentInk : HS.primaryInk,
                    fontSize: 11, fontWeight: 700,
                  }}>{(window.fmtPoints ? window.fmtPoints(pts) : (pts>=0?'+':'')+pts)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </aside>}
    </div>
  );
}

window.DesktopDashboard = DesktopDashboard;
