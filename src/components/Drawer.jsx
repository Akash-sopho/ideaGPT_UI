import { theme, fonts } from '../config/theme.config';
import { Chip } from './Chip';
import { Dot } from './Dot';

const methodColor = {
  GET: { bg: theme.greenBg, col: theme.green, border: theme.greenBorder },
  POST: { bg: theme.amberBg, col: theme.amber, border: theme.amberBorder },
  PUT: { bg: theme.blueBg, col: theme.blue, border: theme.blueBorder },
};

export function Drawer({ api, matchStatus, onClose }) {
  if (!api) return null;

  const methodStyle = methodColor[api.method] || { bg: theme.alt, col: theme.muted, border: theme.border };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(28,25,20,0.38)',
        backdropFilter: 'blur(3px)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="fi"
        style={{
          width: 440,
          height: '100%',
          background: theme.surface,
          borderLeft: `1px solid ${theme.border}`,
          overflowY: 'auto',
          boxShadow: '-16px 0 50px rgba(0,0,0,0.09)',
        }}
      >
        <div style={{ padding: '28px 30px', borderBottom: `1px solid ${theme.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div
                style={{
                  color: theme.faint,
                  fontSize: 11,
                  fontFamily: fonts.mono,
                  letterSpacing: 2,
                  marginBottom: 8,
                }}
              >
                API CONTRACT
              </div>
              <div
                style={{
                  color: theme.ink,
                  fontSize: 19,
                  fontWeight: 700,
                  fontFamily: fonts.serif,
                  lineHeight: 1.3,
                  marginBottom: 10,
                }}
              >
                {api.name}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <Dot status={api.status || 'live'} />
                {api.version && (
                  <Chip color={theme.muted} bg={theme.alt}>
                    v{api.version}
                  </Chip>
                )}
                {api.contract && (
                  <Chip color={theme.blue} bg={theme.blueBg} border={theme.blueBorder}>
                    {api.contract}
                  </Chip>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: theme.alt,
                border: `1px solid ${theme.border}`,
                color: theme.muted,
                width: 32,
                height: 32,
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 17,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ×
            </button>
          </div>
        </div>
        <div
          style={{
            margin: '20px 30px',
            background: theme.alt,
            border: `1px solid ${theme.border}`,
            borderRadius: 10,
            padding: '13px 15px',
            display: 'flex',
            gap: 10,
            alignItems: 'center',
          }}
        >
          <span
            style={{
              background: methodStyle.bg,
              color: methodStyle.col,
              border: `1px solid ${methodStyle.border}`,
              borderRadius: 4,
              padding: '3px 8px',
              fontSize: 11,
              fontWeight: 700,
              fontFamily: fonts.mono,
              flexShrink: 0,
            }}
          >
            {api.method}
          </span>
          <span
            style={{
              color: theme.navy,
              fontFamily: fonts.mono,
              fontSize: 12,
              wordBreak: 'break-all',
            }}
          >
            {api.endpoint}
          </span>
        </div>
        {api.desc && (
          <div style={{ padding: '0 30px 18px' }}>
            <p style={{ color: theme.muted, fontSize: 14, lineHeight: 1.7, margin: 0 }}>{api.desc}</p>
          </div>
        )}
        <div
          style={{
            margin: '0 30px 18px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 10,
          }}
        >
          {[
            ['SLA', api.sla || '—', '⬆'],
            ['Latency', api.latency || '—', '⚡'],
            ['Volume', api.calls || '—', '📈'],
          ].map(([l, v, ic]) => (
            <div
              key={l}
              style={{
                background: theme.alt,
                border: `1px solid ${theme.border}`,
                borderRadius: 10,
                padding: 13,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 18, marginBottom: 5 }}>{ic}</div>
              <div
                style={{
                  color: theme.ink,
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: fonts.mono,
                }}
              >
                {v}
              </div>
              <div style={{ color: theme.faint, fontSize: 11, marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
        {(api.team || api.author) && (
          <div
            style={{
              margin: '0 30px 24px',
              background: theme.alt,
              border: `1px solid ${theme.border}`,
              borderRadius: 10,
              padding: 15,
            }}
          >
            <div
              style={{
                color: theme.faint,
                fontSize: 11,
                letterSpacing: 2,
                fontFamily: fonts.mono,
                marginBottom: 12,
              }}
            >
              OWNERSHIP
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {api.author && (
                <div>
                  <div style={{ color: theme.faint, fontSize: 11, marginBottom: 3 }}>Owner</div>
                  <div style={{ color: theme.ink, fontSize: 13, fontWeight: 600 }}>👤 {api.author}</div>
                </div>
              )}
              {api.team && (
                <div>
                  <div style={{ color: theme.faint, fontSize: 11, marginBottom: 3 }}>Team</div>
                  <div style={{ color: theme.ink, fontSize: 13, fontWeight: 600 }}>🏢 {api.team}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
