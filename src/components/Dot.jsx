import { theme, fonts } from '../config/theme.config';

const statusMap = {
  live: { col: theme.green, lbl: 'LIVE' },
  beta: { col: theme.amber, lbl: 'BETA' },
  enhance: { col: theme.amber, lbl: 'ENHANCE' },
  needs_build: { col: theme.red, lbl: 'NEEDS BUILD' },
};

export function Dot({ status }) {
  const c = statusMap[status] || { col: theme.muted, lbl: (status || '').toUpperCase() };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 11,
        color: c.col,
        fontFamily: fonts.mono,
        fontWeight: 600,
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: c.col,
          display: 'inline-block',
          boxShadow: `0 0 5px ${c.col}88`,
        }}
      />
      {c.lbl}
    </span>
  );
}
