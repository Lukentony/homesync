// Tiny inline icon set — consistent stroke, 24px box
// Usage: <Icon name="check" size={20} color="#000" />

const ICON_PATHS = {
  check:       <polyline points="4 12 10 18 20 6" />,
  plus:        <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
  home:        <path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1V11z" />,
  grid:        <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  calendar:    <><rect x="3" y="5" width="18" height="16" rx="2" /><line x1="3" y1="10" x2="21" y2="10" /><line x1="8" y1="3" x2="8" y2="7" /><line x1="16" y1="3" x2="16" y2="7" /></>,
  trophy:      <><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z" /><path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3" /></>,
  clock:       <><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></>,
  flame:       <path d="M12 2c1 4 5 5 5 10a5 5 0 1 1-10 0c0-2 1-3 2-4-1 3 1 4 2 4 0-3-2-4 1-10z" />,
  bolt:        <polygon points="13 2 4 14 11 14 10 22 20 10 13 10 13 2" />,
  chevron:     <polyline points="9 6 15 12 9 18" />,
  chevronL:    <polyline points="15 6 9 12 15 18" />,
  chevronD:    <polyline points="6 9 12 15 18 9" />,
  menu:        <><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" /></>,
  copy:        <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></>,
  x:           <><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></>,
  bath:        <><path d="M4 12h16v4a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-4z" /><path d="M6 12V6a2 2 0 0 1 4 0" /><line x1="3" y1="22" x2="3" y2="19" /><line x1="21" y1="22" x2="21" y2="19" /></>,
  kitchen:     <><path d="M5 4h3l1 4h2V4h2v4h2l1-4h3" /><path d="M5 4v16h14V4" /><line x1="9" y1="12" x2="15" y2="12" /></>,
  bed:         <><path d="M3 18V9m18 9v-5a3 3 0 0 0-3-3H3" /><path d="M3 14h18M7 10V7a1 1 0 0 1 1-1h4v4" /></>,
  sofa:        <><path d="M4 13V9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" /><path d="M2 13h20v5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-5z" /><line x1="6" y1="20" x2="6" y2="22" /><line x1="18" y1="20" x2="18" y2="22" /></>,
  washing:     <><rect x="4" y="3" width="16" height="18" rx="2" /><circle cx="12" cy="14" r="4" /><circle cx="8" cy="6" r="0.8" fill="currentColor" /><circle cx="11" cy="6" r="0.8" fill="currentColor" /></>,
  flower:      <><circle cx="12" cy="12" r="2.5" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M5 19l3-3M16 8l3-3" /></>,
  undo:        <><polyline points="3 7 3 13 9 13" /><path d="M3 13a9 9 0 1 0 3-7" /></>,
  settings:    <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>,
  history:     <><path d="M3 12a9 9 0 1 0 3-6.7" /><polyline points="3 4 3 9 8 9" /><polyline points="12 7 12 12 15 14" /></>,
  sparkle:     <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6" />,
  filter:      <polygon points="3 4 21 4 14 13 14 20 10 20 10 13 3 4" />,
  search:      <><circle cx="11" cy="11" r="7" /><line x1="20" y1="20" x2="16" y2="16" /></>,
  edit:        <><path d="M4 20h4L20 8l-4-4L4 16v4z" /></>,
  trash:       <><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></>,
  bell:        <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10 21a2 2 0 0 0 4 0" /></>,
  moon:        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
  dots:        <><circle cx="5" cy="12" r="1.5" fill="currentColor" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /><circle cx="19" cy="12" r="1.5" fill="currentColor" /></>,
  plane:       <path d="M21 16l-8-4V4a1 1 0 0 0-2 0v8l-8 4v2l8-2v5l-2 1v1l3-.5 3 .5v-1l-2-1v-5l8 2v-2z" />,
  star:        <polygon points="12 3 14.6 9.2 21 9.9 16 14.3 17.5 21 12 17.5 6.5 21 8 14.3 3 9.9 9.4 9.2" />,
  users:       <><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3 3-5 6-5s6 2 6 5" /><circle cx="17" cy="8" r="3" /><path d="M15 15c2 .5 5 2 5 5" /></>,
  layers:      <><polygon points="12 3 3 8 12 13 21 8 12 3" /><polyline points="3 13 12 18 21 13" /><polyline points="3 18 12 23 21 18" /></>,
};

function Icon({ name, size = 24, color = 'currentColor', strokeWidth = 2, style = {} }) {
  const path = ICON_PATHS[name];
  if (!path) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, ...style }}
    >
      {path}
    </svg>
  );
}

window.Icon = Icon;
