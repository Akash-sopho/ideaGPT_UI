import { theme, fonts, personaColorMap } from '../config/theme.config';
import { appConfig } from '../config/app.config';

function getPersonaStyle(colorName) {
  const key = (colorName || 'blue').toLowerCase();
  return personaColorMap[key] || personaColorMap.blue;
}

export function ReviewScreen({ idea, features, personas, onScan, onBack }) {
  const cfg = appConfig.reviewScreen;
  const selectedFeatures = (features || []).filter((f) => f.on).length;
  const totalSteps = (personas || []).reduce(
    (a, p) => a + (p.journeys || []).reduce((b, j) => b + (j.steps || []).length, 0),
    0
  );
  const stats = [
    [selectedFeatures, cfg.featuresLabel, theme.blue, theme.blueBg, '⚙'],
    [personas.length, cfg.personasLabel, theme.green, theme.greenBg, '👥'],
    [totalSteps, cfg.stepsToAnalyse, theme.purple, theme.purpleBg, '🔍'],
  ];

  return (
    <div className="fu">
      <div style={{ marginBottom: 30 }}>
        <div style={{ color: theme.faint, fontSize: 11, fontFamily: fonts.mono, letterSpacing: 2, marginBottom: 8 }}>
          {cfg.stepLabel}
        </div>
        <h2 style={{ fontFamily: fonts.serif, color: theme.ink, fontSize: 27, margin: '0 0 6px', fontWeight: 700 }}>
          {cfg.title}
        </h2>
        <p style={{ color: theme.muted, fontSize: 14, margin: 0 }}>{cfg.subtitle}</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        {stats.map(([v, l, c, bg, ic]) => (
          <div
            key={l}
            style={{
              background: bg,
              border: `1px solid ${c}22`,
              borderRadius: 14,
              padding: 20,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 26, marginBottom: 8 }}>{ic}</div>
            <div style={{ fontSize: 34, fontWeight: 800, color: c, fontFamily: fonts.mono, lineHeight: 1 }}>{v}</div>
            <div style={{ color: theme.muted, fontSize: 12, marginTop: 5 }}>{l}</div>
          </div>
        ))}
      </div>
      {(personas || []).map((persona) => {
        const style = getPersonaStyle(persona.color);
        const stepsCount = (persona.journeys || []).reduce((a, j) => a + (j.steps || []).length, 0);
        return (
          <div
            key={persona.id}
            style={{
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: 12,
              padding: '14px 18px',
              marginBottom: 10,
            }}
          >
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 20 }}>{persona.icon}</span>
              <span style={{ color: theme.ink, fontSize: 14, fontWeight: 700 }}>{persona.label}</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: theme.faint, fontFamily: fonts.mono }}>
                {stepsCount} steps · {(persona.journeys || []).length} journeys
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(persona.journeys || []).map((j) => (
                <div
                  key={j.id}
                  style={{
                    background: style.colorBg,
                    border: `1px solid ${style.color}33`,
                    borderRadius: 7,
                    padding: '5px 12px',
                    fontSize: 12,
                    color: style.color,
                    fontWeight: 500,
                  }}
                >
                  {j.title} <span style={{ opacity: 0.65 }}>({(j.steps || []).length})</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      <div
        style={{
          background: theme.amberBg,
          border: `1px solid ${theme.amberBorder}`,
          borderRadius: 12,
          padding: '13px 18px',
          marginTop: 18,
          marginBottom: 26,
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
        }}
      >
        <span style={{ fontSize: 17 }}>⚠️</span>
        <div style={{ color: theme.amber, fontSize: 13, lineHeight: 1.6 }}>
          <strong>{cfg.warningTitle}</strong> {cfg.warningBody}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button
          onClick={onBack}
          style={{
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            color: theme.muted,
            borderRadius: 10,
            padding: '10px 20px',
            fontSize: 14,
            cursor: 'pointer',
            fontFamily: fonts.sans,
          }}
        >
          {cfg.back}
        </button>
        <button
          onClick={onScan}
          style={{
            background: theme.accent,
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '13px 30px',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: fonts.sans,
            boxShadow: `0 4px 18px ${theme.accent}44`,
          }}
        >
          🔍 {cfg.scanCta}
        </button>
      </div>
    </div>
  );
}
