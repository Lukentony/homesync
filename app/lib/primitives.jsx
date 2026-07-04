// Shared primitives: Avatar, Pill, CircularProgress, Confetti

function Avatar({ user, size = 36, ring = false, style = {} }) {
  if (!user) return null;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: user.color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.55, lineHeight: 1,
      boxShadow: ring ? `0 0 0 3px ${HS.bg}, 0 0 0 5px ${user.color}` : 'none',
      flexShrink: 0,
      ...style,
    }}>
      <span style={{ filter: 'saturate(1.1)' }}>{user.emoji}</span>
    </div>
  );
}

function BothAvatar({ users = [], size = 36, style = {} }) {
  const [a, b] = users;
  if (!a || !b) return <Avatar user={a || b} size={size} style={style} />;
  const small = size * 0.72;
  return (
    <div style={{ width: size + small * 0.35, height: size, position: 'relative', flexShrink: 0, ...style }}>
      <div style={{ position: 'absolute', left: 0, top: size - small, boxShadow: `0 0 0 2px ${HS.card}`, borderRadius: '50%' }}>
        <Avatar user={a} size={small} />
      </div>
      <div style={{ position: 'absolute', right: 0, top: 0, boxShadow: `0 0 0 2px ${HS.card}`, borderRadius: '50%' }}>
        <Avatar user={b} size={small} />
      </div>
    </div>
  );
}

function Pill({ children, color, bg, style = {} }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 9px', borderRadius: 999,
      background: bg, color,
      fontSize: 11, fontWeight: 600, letterSpacing: 0.2,
      fontFamily: HS.fontUI,
      ...style,
    }}>{children}</span>
  );
}

function CircProgress({ pct = 0, size = 48, stroke = 5, color = HS.primary, bg = HS.hairline, label }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (pct / 100) * c;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={bg} strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset .5s ease' }} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.28, fontWeight: 700, color: HS.ink, fontFamily: HS.fontUI,
      }}>{label != null ? label : `${Math.round(pct)}`}</div>
    </div>
  );
}

// Sector ring — used on Home variant to show % of day done
function Dial({ pct = 0, size = 220, stroke = 14, color = HS.primary, children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (pct / 100) * c;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={HS.hairline} strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.2,.9,.3,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </div>
    </div>
  );
}

// Lightweight confetti on completion
function Confetti({ show, originX = 0.5, originY = 0.5 }) {
  if (!show) return null;
  const pieces = Array.from({ length: 14 }).map((_, i) => {
    const angle = (i / 14) * Math.PI * 2;
    const dist = 40 + Math.random() * 60;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    const colors = [HS.primary, HS.sage, HS.soon, HS.overdue];
    const c = colors[i % colors.length];
    const rot = Math.random() * 360;
    const delay = Math.random() * 60;
    return (
      <span key={i} style={{
        position: 'absolute',
        left: `${originX * 100}%`, top: `${originY * 100}%`,
        width: 8, height: 12, borderRadius: 2,
        background: c, pointerEvents: 'none',
        transform: 'translate(-50%,-50%)',
        animation: `hs-confetti 700ms ${delay}ms ease-out forwards`,
        '--dx': `${dx}px`, '--dy': `${dy}px`, '--rot': `${rot}deg`,
      }} />
    );
  });
  return <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>{pieces}</div>;
}

Object.assign(window, { Avatar, BothAvatar, Pill, CircProgress, Dial, Confetti });
