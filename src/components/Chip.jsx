import { theme, fonts } from '../config/theme.config';

export function Chip({ color = theme.navy, bg = theme.blueBg, border, children }) {
  return (
    <span
      style={{
        background: bg,
        color,
        border: `1px solid ${border || color + '22'}`,
        borderRadius: 4,
        padding: '2px 8px',
        fontSize: 11,
        fontFamily: fonts.mono,
        fontWeight: 500,
        display: 'inline-block',
      }}
    >
      {children}
    </span>
  );
}
