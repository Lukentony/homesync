// Invite bottom-sheet — share code/link to invite a new household member

function InviteSheet({ open, onClose }) {
  const [copied, setCopied] = React.useState(null);
  if (!open) return null;

  const code = 'ADA-LEO-4719';
  const link = `https://homesync.app/join/${code.toLowerCase()}`;

  const copy = (text, label) => {
    try {
      navigator.clipboard?.writeText(text);
    } catch {}
    setCopied(label);
    setTimeout(() => setCopied(null), 1600);
  };

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
        padding: '14px 20px 28px',
        animation: 'hs-slide-up 260ms cubic-bezier(.2,.9,.3,1)',
      }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: HS.hairline, margin: '0 auto 14px' }} />

        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: `linear-gradient(135deg, ${HS.primarySoft} 0%, ${HS.soonSoft} 100%)`,
            margin: '0 auto 10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32,
          }}>💌</div>
          <h2 style={{ margin: '0 0 4px', fontFamily: HS.fontDisplay, fontSize: 24, fontWeight: 500, color: HS.ink, letterSpacing: -0.5 }}>
            Invita un coinquilino
          </h2>
          <div style={{ fontFamily: HS.fontUI, fontSize: 13, color: HS.ink2, maxWidth: 260, margin: '0 auto' }}>
            Condividi il codice o il link, basta un tap
          </div>
        </div>

        {/* Code card */}
        <div style={{
          background: HS.card, borderRadius: HS.r.lg, padding: '16px 18px',
          boxShadow: HS.shadow.card, marginBottom: 10,
        }}>
          <div style={{ fontFamily: HS.fontUI, fontSize: 10.5, color: HS.ink3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2 }}>
            Codice invito
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
            <div style={{
              flex: 1, fontFamily: HS.fontMono || 'monospace', fontSize: 22, fontWeight: 700,
              color: HS.ink, letterSpacing: 1.5,
            }}>{code}</div>
            <button onClick={() => copy(code, 'code')} style={{
              border: 'none', background: copied === 'code' ? HS.sage : HS.primarySoft,
              color: copied === 'code' ? '#fff' : HS.primaryInk,
              padding: '10px 14px', borderRadius: 12, cursor: 'pointer',
              fontFamily: HS.fontUI, fontSize: 12.5, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'background .2s',
            }}>
              <Icon name={copied === 'code' ? 'check' : 'copy'} size={14} color={copied === 'code' ? '#fff' : HS.primaryInk} strokeWidth={2.5} />
              {copied === 'code' ? 'Copiato' : 'Copia'}
            </button>
          </div>
        </div>

        {/* Link card */}
        <div style={{
          background: HS.card, borderRadius: HS.r.lg, padding: '14px 18px',
          boxShadow: HS.shadow.card, marginBottom: 16,
        }}>
          <div style={{ fontFamily: HS.fontUI, fontSize: 10.5, color: HS.ink3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2 }}>
            Link diretto
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
            <div style={{
              flex: 1, fontFamily: HS.fontUI, fontSize: 13, color: HS.ink2,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{link}</div>
            <button onClick={() => copy(link, 'link')} style={{
              border: 'none', background: copied === 'link' ? HS.sage : HS.bgSunken,
              color: copied === 'link' ? '#fff' : HS.ink2,
              padding: '10px 14px', borderRadius: 12, cursor: 'pointer',
              fontFamily: HS.fontUI, fontSize: 12.5, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'background .2s',
            }}>
              <Icon name={copied === 'link' ? 'check' : 'copy'} size={14} color={copied === 'link' ? '#fff' : HS.ink2} strokeWidth={2.5} />
              {copied === 'link' ? 'Copiato' : 'Copia'}
            </button>
          </div>
        </div>

        {/* Share buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[
            { id: 'wa',  label: 'WhatsApp', bg: '#25D366', emoji: '💬' },
            { id: 'sms', label: 'SMS',      bg: HS.soon,   emoji: '📱' },
            { id: 'mail',label: 'Email',    bg: HS.overdue,emoji: '✉️' },
          ].map(s => (
            <button key={s.id} onClick={() => copy(link, s.id)} style={{
              flex: 1, border: 'none', cursor: 'pointer',
              padding: '12px 8px', borderRadius: HS.r.md,
              background: s.bg, color: '#fff',
              fontFamily: HS.fontUI, fontSize: 12.5, fontWeight: 700,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              boxShadow: HS.shadow.card,
            }}>
              <span style={{ fontSize: 20 }}>{s.emoji}</span>
              {s.label}
            </button>
          ))}
        </div>

        <div style={{
          padding: '12px 14px', background: HS.bgSunken, borderRadius: HS.r.md,
          fontFamily: HS.fontUI, fontSize: 12, color: HS.ink2, lineHeight: 1.5,
        }}>
          <strong style={{ color: HS.ink }}>Come funziona:</strong> chi apre il link viene aggiunto alla casa e inizia con 0 punti. Il codice scade tra 7 giorni.
        </div>
      </div>
    </div>
  );
}

window.InviteSheet = InviteSheet;
