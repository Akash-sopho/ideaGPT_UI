import { theme, fonts } from '../config/theme.config';
import { appConfig } from '../config/app.config';

export function IdeaScreen({ idea, setIdea, onAnalyse, loading }) {
  const cfg = appConfig.ideaScreen;
  const examples = appConfig.exampleIdeas || [];

  const handleSubmit = () => {
    if (!idea.trim() || loading) return;
    onAnalyse();
  };

  return (
    <div className="fu" style={{ maxWidth: 620, margin: '72px auto 0' }}>
      <div style={{ textAlign: 'center', marginBottom: 44 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: theme.blueBg,
            border: `1px solid ${theme.blueBorder}`,
            borderRadius: 100,
            padding: '6px 16px',
            fontSize: 12,
            color: theme.blue,
            fontFamily: fonts.mono,
            marginBottom: 20,
          }}
        >
          ⚡ {cfg.badge}
        </div>
        <h1
          style={{
            fontSize: 44,
            fontWeight: 700,
            fontFamily: fonts.serif,
            color: theme.ink,
            lineHeight: 1.18,
            margin: '0 0 14px',
            letterSpacing: -1,
          }}
        >
          What are you
          <br />
          <em style={{ color: theme.accent }}>{cfg.titleEmphasis || 'building today?'}</em>
        </h1>
        <p style={{ color: theme.muted, fontSize: 15, lineHeight: 1.7, margin: 0 }}>{cfg.subtitle}</p>
      </div>
      <div
        style={{
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(26,39,68,0.07)',
        }}
      >
        <textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.metaKey && idea.trim()) handleSubmit();
          }}
          placeholder={appConfig.ideaPlaceholder}
          rows={5}
          disabled={loading}
          style={{
            width: '100%',
            padding: '22px 24px',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: theme.ink,
            fontSize: 15,
            lineHeight: 1.7,
            resize: 'none',
            fontFamily: fonts.sans,
            boxSizing: 'border-box',
          }}
        />
        <div
          style={{
            padding: '13px 20px',
            borderTop: `1px solid ${theme.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: theme.alt,
          }}
        >
          <span style={{ color: theme.faint, fontSize: 12, fontFamily: fonts.mono }}>{cfg.shortcutHint}</span>
          <button
            onClick={handleSubmit}
            disabled={!idea.trim() || loading}
            style={{
              background: idea.trim() && !loading ? theme.navy : theme.border,
              color: idea.trim() && !loading ? '#fff' : theme.muted,
              border: 'none',
              borderRadius: 9,
              padding: '11px 26px',
              fontSize: 14,
              fontWeight: 600,
              cursor: idea.trim() && !loading ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              fontFamily: fonts.sans,
            }}
          >
            {loading ? 'Analysing…' : cfg.analyseCta}
          </button>
        </div>
      </div>
      {loading && (
        <p style={{ textAlign: 'center', color: theme.muted, fontSize: 13, marginTop: 12 }}>Analysing idea…</p>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
        {examples.map((ex) => (
          <button
            key={ex}
            onClick={() => setIdea(ex)}
            disabled={loading}
            style={{
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              color: theme.muted,
              borderRadius: 100,
              padding: '7px 16px',
              fontSize: 12,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: fonts.sans,
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.borderColor = theme.navy;
                e.currentTarget.style.color = theme.navy;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = theme.border;
              e.currentTarget.style.color = theme.muted;
            }}
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
