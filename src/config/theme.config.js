/**
 * Design tokens from ideagpt.jsx. No hardcoded colors in components.
 */
export const theme = {
  bg: '#f6f4ef',
  surface: '#ffffff',
  alt: '#f0ede7',
  border: '#e2dbd0',
  borderMid: '#c9c0b3',
  ink: '#1c1914',
  muted: '#6b6358',
  faint: '#9c9388',
  navy: '#1b2845',
  navyHover: '#253561',
  accent: '#d94f1e',
  blue: '#1a4fa0',
  blueBg: '#eef4ff',
  blueBorder: '#bcd2f5',
  green: '#1c7a4c',
  greenBg: '#eef8f2',
  greenBorder: '#b4dcc7',
  red: '#bb2e20',
  redBg: '#fdf1f0',
  redBorder: '#f0bfba',
  amber: '#a85c00',
  amberBg: '#fef8ec',
  amberBorder: '#f0d88a',
  purple: '#6d28d9',
  purpleBg: '#f5f3ff',
  purpleBorder: '#d0c4f8',
};

export const fonts = {
  serif: "'Lora', serif",
  mono: "'DM Mono', monospace",
  sans: "'DM Sans', sans-serif",
};

/** Map persona color name from API to theme keys */
export const personaColorMap = {
  blue: { color: '#1a4fa0', colorBg: '#eef4ff', colorBorder: '#bcd2f5' },
  green: { color: '#1c7a4c', colorBg: '#eef8f2', colorBorder: '#b4dcc7' },
  purple: { color: '#6d28d9', colorBg: '#f5f3ff', colorBorder: '#d0c4f8' },
  amber: { color: '#a85c00', colorBg: '#fef8ec', colorBorder: '#f0d88a' },
};
