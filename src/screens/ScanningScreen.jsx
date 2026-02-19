import { theme, fonts } from '../config/theme.config';
import { appConfig } from '../config/app.config';
import { scanConfig } from '../config/scan.config';

export function ScanningScreen({ scanProgress }) {
  const messages = scanConfig.loadingMessages || appConfig.scanningScreen?.loadingMessages || [];
  const cfg = appConfig.scanningScreen || {};
  const total = scanProgress?.total || 0;
  const done = scanProgress?.done ?? 0;
  const currentMessage = scanProgress?.current || messages[Math.min(done, messages.length - 1)] || messages[0];

  return (
    <div
      className="fi"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: 26,
      }}
    >
      <div style={{ position: 'relative', width: 68, height: 68 }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: `3px solid ${theme.border}`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '3px solid transparent',
            borderTopColor: theme.navy,
            animation: 'spin 0.9s linear infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 10,
            borderRadius: '50%',
            border: '3px solid transparent',
            borderTopColor: theme.accent,
            animation: 'spin 1.4s linear infinite reverse',
          }}
        />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
          🔍
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            color: theme.ink,
            fontSize: 16,
            fontWeight: 600,
            marginBottom: 5,
            fontFamily: fonts.serif,
          }}
        >
          {currentMessage}
        </div>
        <div style={{ color: theme.muted, fontSize: 13, fontFamily: fonts.mono }}>{cfg.subtext}</div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {messages.map((_, i) => (
          <div
            key={i}
            style={{
              width: i <= (total ? Math.floor((done / total) * messages.length) : 0) ? 24 : 8,
              height: 8,
              borderRadius: 4,
              background: i <= (total ? Math.floor((done / total) * messages.length) : 0) ? theme.navy : theme.border,
              transition: 'all 0.3s',
            }}
          />
        ))}
      </div>
      {total > 0 && (
        <div style={{ fontSize: 12, color: theme.muted, fontFamily: fonts.mono }}>
          {done} / {total}
        </div>
      )}
    </div>
  );
}
