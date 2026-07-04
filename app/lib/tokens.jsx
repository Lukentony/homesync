// HomeSync design tokens — warm, playful, gamified
// Exports globals via window

const HS = {
  // Surfaces — warm paper whites
  bg:        '#FBF6EE',       // app background (warm cream)
  bgSunken:  '#F4ECDD',       // section / sunk
  card:      '#FFFFFF',
  ink:       '#2A1D14',       // deep plum-brown text
  ink2:      '#6B5B4F',       // secondary text
  ink3:      '#A89A8B',       // tertiary
  hairline:  'rgba(42,29,20,0.08)',

  // Brand — warm amber primary
  primary:   '#E2743A',       // oklch(~0.68 0.16 55)
  primarySoft: '#FCE6D4',
  primaryInk:  '#7A2E0B',

  // Status — all share similar chroma, varied hue
  sage:      '#6F9E7A',       // done / ok (calmer green)
  sageSoft:  '#E4EFDF',
  sageInk:   '#2E5536',

  urgent:    '#D94B4B',
  urgentSoft:'#FBE0DC',
  urgentInk: '#7A1E1E',

  soon:      '#E0A93A',       // yellow-amber
  soonSoft:  '#FBEFD0',
  soonInk:   '#6D4A0E',

  overdue:   '#8C5AC8',
  overdueSoft:'#EFE2F7',
  overdueInk: '#432970',

  // Users
  userA: { name: 'Ada', emoji: '🦊', color: '#E2743A', colorSoft: '#FCE6D4' },
  userB: { name: 'Leo', emoji: '🐻', color: '#6F9E7A', colorSoft: '#E4EFDF' },

  // Radii + shadows
  r: { sm: 12, md: 18, lg: 24, xl: 32, pill: 9999 },
  shadow: {
    card: '0 1px 2px rgba(42,29,20,0.04), 0 4px 12px rgba(42,29,20,0.05)',
    pop:  '0 4px 12px rgba(42,29,20,0.10), 0 12px 32px rgba(42,29,20,0.12)',
    fab:  '0 6px 20px rgba(226,116,58,0.35), 0 2px 6px rgba(226,116,58,0.25)',
  },

  // Type
  fontDisplay: '"Fraunces", Georgia, serif',
  fontUI: '"Inter", -apple-system, system-ui, sans-serif',
  fontMono: '"JetBrains Mono", ui-monospace, monospace',
};

window.HS = HS;
