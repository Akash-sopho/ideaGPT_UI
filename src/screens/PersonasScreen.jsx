import { theme, fonts, personaColorMap } from '../config/theme.config';
import { appConfig } from '../config/app.config';

function getPersonaStyle(colorName) {
  const key = (colorName || 'blue').toLowerCase();
  return personaColorMap[key] || personaColorMap.blue;
}

export function PersonasScreen({ personas, onReview, onBack }) {
  const cfg = appConfig.personasScreen;
  const totalSteps = personas.reduce((a, p) => a + (p.journeys || []).reduce((b, j) => b + (j.steps || []).length, 0), 0);

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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 18, marginBottom: 28 }}>
        {personas.map((persona) => {
          const style = getPersonaStyle(persona.color);
          const color = style.color;
          const colorBg = style.colorBg;
          return (
            <div
              key={persona.id}
              style={{
                background: theme.surface,
                border: `1.5px solid ${color}`,
                borderRadius: 16,
                overflow: 'hidden',
                boxShadow: `0 4px 18px ${color}18`,
              }}
            >
              <div
                style={{
                  background: colorBg,
                  padding: '15px 18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: `1px solid ${theme.border}`,
                }}
              >
                <div style={{ display: 'flex', gap: 11, alignItems: 'center' }}>
                  <span style={{ fontSize: 26 }}>{persona.icon}</span>
                  <div>
                    <div style={{ color: theme.ink, fontSize: 14, fontWeight: 700 }}>{persona.label}</div>
                    <div style={{ color: theme.muted, fontSize: 12 }}>{persona.desc}</div>
                  </div>
                </div>
              </div>
              {(persona.journeys || []).map((j) => (
                <div key={j.id} style={{ padding: '13px 18px', borderBottom: `1px solid ${theme.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: color,
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ color: theme.ink, fontSize: 13, fontWeight: 600 }}>{j.title}</div>
                    <div style={{ marginLeft: 'auto', fontSize: 11, color: theme.faint, fontFamily: fonts.mono }}>
                      {(j.steps || []).length} {cfg.stepsLabel}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {(j.steps || []).map((step) => (
                      <div
                        key={step.id}
                        style={{
                          background: theme.alt,
                          border: `1px solid ${theme.border}`,
                          borderRadius: 6,
                          padding: '3px 8px',
                          fontSize: 11,
                          color: theme.muted,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                        }}
                      >
                        <span>{step.icon}</span>
                        <span>{step.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ color: theme.muted, fontSize: 13 }}>
            <strong style={{ color: theme.ink }}>{personas.length}</strong> {cfg.personasLabel} ·{' '}
            <strong style={{ color: theme.ink }}>{totalSteps}</strong> {cfg.stepsLabel}
          </div>
          <button
            onClick={onReview}
            style={{
              background: theme.navy,
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '12px 26px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: fonts.sans,
            }}
          >
            {cfg.reviewCta}
          </button>
        </div>
      </div>
    </div>
  );
}
