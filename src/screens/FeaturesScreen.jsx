import { useState } from 'react';
import { theme, fonts } from '../config/theme.config';
import { appConfig } from '../config/app.config';

const DEFAULT_ICON = '⚙️';

export function FeaturesScreen({ idea, features, setFeatures, onMapJourneys, loading, error, onRetry, onRegenerateFeatures, loadingRegenerate }) {
  const cfg = appConfig.featuresScreen;
  const selected = features.filter((f) => f.on).length;
  const [editingFeature, setEditingFeature] = useState(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formIcon, setFormIcon] = useState(DEFAULT_ICON);

  const openAdd = () => {
    setFormTitle('');
    setFormDesc('');
    setFormIcon(DEFAULT_ICON);
    setEditingFeature('new');
  };

  const openEdit = (f, e) => {
    e.stopPropagation();
    setFormTitle(f.title);
    setFormDesc(f.desc || '');
    setFormIcon(f.icon || DEFAULT_ICON);
    setEditingFeature(f.id);
  };

  const closeForm = () => setEditingFeature(null);

  const saveFeature = (e) => {
    e.preventDefault();
    const title = formTitle.trim();
    if (!title) return;
    const desc = (formDesc || '').trim();
    const icon = (formIcon || DEFAULT_ICON).trim().slice(0, 2) || DEFAULT_ICON;

    if (editingFeature === 'new') {
      setFeatures((prev) => [
        ...prev,
        { id: `f-${Date.now()}`, icon, title, desc, on: true },
      ]);
    } else {
      setFeatures((prev) =>
        prev.map((x) =>
          x.id === editingFeature ? { ...x, icon, title, desc } : x
        )
      );
    }
    closeForm();
  };

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
              <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{f.icon}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: theme.ink, fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{f.title}</div>
                  <div style={{ color: theme.muted, fontSize: 12, lineHeight: 1.5 }}>{f.desc}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={(e) => openEdit(f, e)}
                  disabled={loading}
                  title={cfg.editFeatureCta}
                  style={{
                    padding: 6,
                    border: 'none',
                    background: 'transparent',
                    color: theme.muted,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    borderRadius: 6,
                    fontSize: 14,
                  }}
                >
                  ✏️
                </button>
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
                    transition: 'all 0.2s',
                  }}
                >
                  {f.on && <span style={{ color: '#fff', fontSize: 12 }}>✓</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ color: theme.muted, fontSize: 13 }}>
            <strong style={{ color: theme.ink }}>{selected}</strong> {cfg.of} {features.length} {cfg.featuresSelected}
          </div>
          {onRegenerateFeatures && (
            <button
              type="button"
              onClick={onRegenerateFeatures}
              disabled={loading || loadingRegenerate}
              style={{
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                color: theme.muted,
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 12,
                cursor: loading || loadingRegenerate ? 'not-allowed' : 'pointer',
                fontFamily: fonts.sans,
              }}
            >
              {loadingRegenerate ? 'Regenerating…' : (cfg.regenerateCta || 'Regenerate features')}
            </button>
          )}
          <button
            type="button"
            onClick={openAdd}
            disabled={loading}
            style={{
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              color: theme.ink,
              borderRadius: 8,
              padding: '8px 16px',
              fontSize: 12,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: fonts.sans,
            }}
          >
            {cfg.addFeatureCta || 'Add feature'}
          </button>
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

      {editingFeature !== null && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={closeForm}
        >
          <div
            style={{
              background: theme.surface,
              borderRadius: 12,
              padding: 24,
              maxWidth: 420,
              width: '90%',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontFamily: fonts.serif, color: theme.ink, margin: '0 0 16px', fontSize: 18 }}>
              {editingFeature === 'new' ? (cfg.addFeatureTitle || 'New feature') : (cfg.editFeatureTitle || 'Edit feature')}
            </h3>
            <form onSubmit={saveFeature}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, color: theme.muted, marginBottom: 4 }}>Title</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder={cfg.featureTitlePlaceholder}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${theme.border}`,
                    borderRadius: 8,
                    fontSize: 14,
                    fontFamily: fonts.sans,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, color: theme.muted, marginBottom: 4 }}>Description</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder={cfg.featureDescPlaceholder}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${theme.border}`,
                    borderRadius: 8,
                    fontSize: 14,
                    fontFamily: fonts.sans,
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, color: theme.muted, marginBottom: 4 }}>Icon (emoji)</label>
                <input
                  type="text"
                  value={formIcon}
                  onChange={(e) => setFormIcon(e.target.value)}
                  placeholder="⚙️"
                  style={{
                    width: 60,
                    padding: '8px 10px',
                    border: `1px solid ${theme.border}`,
                    borderRadius: 8,
                    fontSize: 18,
                    textAlign: 'center',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={closeForm}
                  style={{
                    background: theme.surface,
                    border: `1px solid ${theme.border}`,
                    color: theme.muted,
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontSize: 13,
                    cursor: 'pointer',
                    fontFamily: fonts.sans,
                  }}
                >
                  {cfg.cancelCta || 'Cancel'}
                </button>
                <button
                  type="submit"
                  style={{
                    background: theme.navy,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontSize: 13,
                    cursor: 'pointer',
                    fontFamily: fonts.sans,
                  }}
                >
                  {cfg.saveFeatureCta || 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
