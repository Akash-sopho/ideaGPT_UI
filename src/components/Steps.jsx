import { theme, fonts } from '../config/theme.config';
import { appConfig } from '../config/app.config';

export function Steps({ phase }) {
  const list = appConfig.steps;
  const idx = list.findIndex((s) => s.phase === phase);
  const currentIdx = idx >= 0 ? idx : 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 40 }}>
      {list.map((step, i) => (
        <div
          key={step.phase}
          style={{ display: 'flex', alignItems: 'center', flex: i < list.length - 1 ? 1 : 'none' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: i < currentIdx ? theme.navy : i === currentIdx ? theme.navy : theme.border,
                color: i <= currentIdx ? '#fff' : theme.faint,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
                fontFamily: fonts.mono,
                transition: 'all 0.3s',
                outline: i === currentIdx ? `3px solid ${theme.blueBg}` : 'none',
                outlineOffset: 2,
              }}
            >
              {i < currentIdx ? '✓' : i + 1}
            </div>
            <div
              style={{
                fontSize: 11,
                color: i <= currentIdx ? theme.navy : theme.faint,
                fontWeight: i === currentIdx ? 600 : 400,
                whiteSpace: 'nowrap',
                fontFamily: fonts.sans,
              }}
            >
              {step.label}
            </div>
          </div>
          {i < list.length - 1 && (
            <div
              style={{
                flex: 1,
                height: 2,
                background: i < currentIdx ? theme.navy : theme.border,
                margin: '0 4px',
                marginBottom: 18,
                transition: 'background 0.3s',
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
