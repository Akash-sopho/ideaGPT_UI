import { theme, fonts } from '../config/theme.config';
import { appConfig } from '../config/app.config';

export function FeaturesScreen({ idea, features, setFeatures, onMapJourneys, loading, error, onRetry }) {
  const cfg = appConfig.featuresScreen;
  const selected = features.filter((f) => f.on).length;

  return (
    <div className="fu">
      <div style={{ marginBottom: 30 }}>
        <div
          style={{
            color: theme.faint,
            fontSize: 11,
            fontFamily: "'DM Mono', monospace",
            letterSpacing: 2,
            marginBottom: 8,
          }}
        >
          {cfg.stepLabel}
        </div>
        <h2 style={{ fontFamily: "'Lora', serif", color: theme.ink, fontSize: 27, margin: '0 0 6px', fontWeight: 700 }}>
          {cfg.title}
        </h2>
        <p style={{ color: theme.muted, fontSize: 14, margin: 0 }}>{cfg.subtitle}</p>
      </div>
      <div
        style={{
          background: theme.blueBg,
          border: `1px solid ${theme.blueBorder}`,
          borderRadius: 12,
          padding: '13px 18px',
          marginBottom: 26,
          display: 'flex',
          gap: 12,
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: 18 }}>💡</span>
        <div style={{ color: theme.blue, fontSize: 14, fontStyle: 'italic', fontFamily: "'Lora', serif" }}>
          "{idea}"
        </div>
      </div>
      {error && (
        <div
          style={{
            background: theme.redBg,
            border: `1px solid ${theme.redBorder}`,
            borderRadius: 12,
            padding: '12px 18px',
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ color: theme.red, fontSize: 13 }}>{error}</span>
          {onRetry && (
            <button
              onClick={onRetry}
              style={{
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                color: theme.ink,
                borderRadius: 8,
                padding: '6px 14px',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          )}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 12, marginBottom: 28 }}>
        {features.map((f, idx) => (
          <div
            key={f.id}
            className="hov-card"
            onClick={() => !loading && setFeatures((prev) => prev.map((x, i) => (i === idx ? { ...x, on: !x.on } : x)))}
            style={{
              background: theme.surface,
              border: `1.5px solid ${f.on ? theme.navy : theme.border}`,
              borderRadius: 12,
              padding: '15px 17px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              opacity: f.on ? 1 : 0.5,
              boxShadow: f.on ? '0 2px 10px rgba(26,39,68,0.07)' : 'none',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{f.icon}</span>
                <div>
                  <div style={{ color: theme.ink, fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{f.title}</div>
                  <div style={{ color: theme.muted, fontSize: 12, lineHeight: 1.5 }}>{f.desc}</div>
                </div>
              </div>
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 5,
                  border: `2px solid ${f.on ? theme.navy : theme.border}`,
                  background: f.on ? theme.navy : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.2s',
                }}
              >
                {f.on && <span style={{ color: '#fff', fontSize: 12 }}>✓</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: theme.muted, fontSize: 13 }}>
          <strong style={{ color: theme.ink }}>{selected}</strong> {cfg.of} {features.length} {cfg.featuresSelected}
        </div>
        <button
          onClick={onMapJourneys}
          disabled={loading}
          style={{
            background: theme.navy,
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '12px 28px',
            fontSize: 14,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: fonts.sans,
          }}
        >
          {loading ? 'Suggesting personas…' : cfg.mapJourneysCta}
        </button>
      </div>
    </div>
  );
}
