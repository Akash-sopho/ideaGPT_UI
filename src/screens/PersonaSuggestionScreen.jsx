import { useState } from 'react';
import { theme, fonts, personaColorMap } from '../config/theme.config';
import { appConfig } from '../config/app.config';

const DEFAULT_COLORS = ['blue', 'green', 'purple', 'amber'];

function getPersonaStyle(colorName) {
  const key = (colorName || 'blue').toLowerCase();
  return personaColorMap[key] || personaColorMap.blue;
}

export function PersonaSuggestionScreen({
  personaSuggestions,
  confirmedPersonas,
  setConfirmedPersonas,
  onConfirm,
  loading,
  error,
  onRetry,
}) {
  const cfg = appConfig.personaSuggestionScreen;
  const list = confirmedPersonas.length ? confirmedPersonas : personaSuggestions.map((p) => ({
    ...p,
    color: p.color || 'blue',
    colorBg: getPersonaStyle(p.color).colorBg,
    colorBorder: getPersonaStyle(p.color).colorBorder,
    selected: true,
  }));

  const updateList = (next) => {
    setConfirmedPersonas(next);
  };

  const toggleSelected = (id) => {
    const next = list.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p));
    const selectedCount = next.filter((p) => p.selected).length;
    if (selectedCount >= 1) updateList(next);
  };

  const updateField = (id, field, value) => {
    updateList(
      list.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const addCustom = () => {
    const used = list.map((p) => p.id);
    let id = 'custom_1';
    let n = 1;
    while (used.includes(id)) id = `custom_${++n}`;
    const style = getPersonaStyle(DEFAULT_COLORS[list.length % DEFAULT_COLORS.length]);
    updateList([
      ...list.map((p) => ({ ...p, colorBg: p.colorBg || getPersonaStyle(p.color).colorBg, colorBorder: p.colorBorder || getPersonaStyle(p.color).colorBorder })),
      {
        id,
        label: 'New Persona',
        icon: '👤',
        desc: 'Describe this persona',
        rationale: '',
        suggested_journeys: [],
        is_primary: false,
        color: DEFAULT_COLORS[list.length % DEFAULT_COLORS.length],
        colorBg: style.colorBg,
        colorBorder: style.colorBorder,
        selected: true,
      },
    ]);
  };

  const handleConfirm = () => {
    const selected = list.filter((p) => p.selected);
    if (selected.length < 1) return;
    onConfirm(selected);
  };

  if (list.length === 0 && personaSuggestions.length === 0 && !loading) {
    return null;
  }

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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 18, marginBottom: 28 }}>
        {list.map((persona) => {
          const style = getPersonaStyle(persona.color);
          const sel = persona.selected !== false;
          const colorBg = persona.colorBg || style.colorBg;
          const colorBorder = persona.colorBorder || style.colorBorder;
          const color = style.color;
          return (
            <div
              key={persona.id}
              style={{
                background: theme.surface,
                border: `1.5px solid ${sel ? color : theme.border}`,
                borderRadius: 16,
                overflow: 'hidden',
                transition: 'all 0.2s',
                opacity: sel ? 1 : 0.52,
                boxShadow: sel ? `0 4px 18px ${color}18` : 'none',
              }}
            >
              <div
                style={{
                  background: sel ? colorBg : theme.alt,
                  padding: '15px 18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  borderBottom: `1px solid ${theme.border}`,
                }}
              >
                <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 26, flexShrink: 0 }}>{persona.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <input
                      value={persona.label}
                      onChange={(e) => updateField(persona.id, 'label', e.target.value)}
                      style={{
                        display: 'block',
                        width: '100%',
                        border: 'none',
                        background: 'transparent',
                        color: theme.ink,
                        fontSize: 14,
                        fontWeight: 700,
                        fontFamily: fonts.sans,
                        marginBottom: 4,
                        outline: 'none',
                      }}
                    />
                    <input
                      value={persona.desc}
                      onChange={(e) => updateField(persona.id, 'desc', e.target.value)}
                      placeholder="Description"
                      style={{
                        display: 'block',
                        width: '100%',
                        border: 'none',
                        background: 'transparent',
                        color: theme.muted,
                        fontSize: 12,
                        fontFamily: fonts.sans,
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>
                <button
                  onClick={() => toggleSelected(persona.id)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 7,
                    border: `2px solid ${sel ? color : theme.border}`,
                    background: sel ? color : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    flexShrink: 0,
                  }}
                >
                  {sel && <span style={{ color: '#fff', fontSize: 13 }}>✓</span>}
                </button>
              </div>
              <div style={{ padding: '13px 18px', borderBottom: `1px solid ${theme.border}` }}>
                {persona.is_primary && (
                  <span
                    style={{
                      display: 'inline-block',
                      background: colorBg,
                      color,
                      border: `1px solid ${colorBorder}`,
                      borderRadius: 4,
                      padding: '2px 8px',
                      fontSize: 10,
                      fontWeight: 600,
                      marginBottom: 8,
                    }}
                  >
                    {cfg.primaryBadge}
                  </span>
                )}
                {persona.rationale && (
                  <div style={{ color: theme.muted, fontSize: 12, lineHeight: 1.5, marginBottom: 8 }}>
                    {persona.rationale}
                  </div>
                )}
                {Array.isArray(persona.suggested_journeys) && persona.suggested_journeys.length > 0 && (
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {persona.suggested_journeys.map((j, i) => (
                      <span
                        key={i}
                        style={{
                          background: theme.alt,
                          border: `1px solid ${theme.border}`,
                          borderRadius: 6,
                          padding: '3px 8px',
                          fontSize: 11,
                          color: theme.muted,
                        }}
                      >
                        {j}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <button
          type="button"
          onClick={addCustom}
          style={{
            background: theme.surface,
            border: `1px dashed ${theme.border}`,
            color: theme.muted,
            borderRadius: 10,
            padding: '10px 20px',
            fontSize: 14,
            cursor: 'pointer',
            fontFamily: fonts.sans,
          }}
        >
          + {cfg.addCustom}
        </button>
        <button
          onClick={handleConfirm}
          disabled={loading || list.filter((p) => p.selected).length < 1}
          style={{
            background: list.filter((p) => p.selected).length >= 1 && !loading ? theme.navy : theme.border,
            color: list.filter((p) => p.selected).length >= 1 && !loading ? '#fff' : theme.muted,
            border: 'none',
            borderRadius: 10,
            padding: '12px 26px',
            fontSize: 14,
            fontWeight: 600,
            cursor: list.filter((p) => p.selected).length >= 1 && !loading ? 'pointer' : 'not-allowed',
            fontFamily: fonts.sans,
          }}
        >
          {loading ? 'Building journey maps…' : cfg.confirmCta}
        </button>
      </div>
    </div>
  );
}
