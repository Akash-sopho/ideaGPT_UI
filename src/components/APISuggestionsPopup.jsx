import { useState } from 'react';
import { theme, fonts } from '../config/theme.config';

const methodColor = {
  GET: { bg: theme.greenBg, col: theme.green, border: theme.greenBorder },
  POST: { bg: theme.amberBg, col: theme.amber, border: theme.amberBorder },
  PUT: { bg: theme.blueBg, col: theme.blue, border: theme.blueBorder },
};

export function APISuggestionsPopup({
  apiKey,
  stepLabel,
  suggestedApis = [],
  enhancements = [],
  onClose,
  onRerank,
  onSelectApi,
  loadingRerank = false,
}) {
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [expandedKey, setExpandedKey] = useState(null);

  const toggleExpanded = (key) => {
    setExpandedKey((prev) => (prev === key ? null : key));
  };

  const handleRefine = () => {
    if (onRerank && additionalInfo.trim()) {
      onRerank(apiKey, additionalInfo.trim());
    }
  };

  const handleSelect = (item) => {
    if (item?.api && onSelectApi) {
      onSelectApi(apiKey, item.api);
    }
  };

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
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 560,
          maxHeight: '90vh',
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${theme.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexShrink: 0,
          }}
        >
          <div>
            <div
              style={{
                color: theme.faint,
                fontSize: 11,
                fontFamily: fonts.mono,
                letterSpacing: 2,
                marginBottom: 6,
              }}
            >
              CHOOSE API FOR THIS STEP
            </div>
            <h2
              style={{
                margin: 0,
                color: theme.ink,
                fontSize: 18,
                fontWeight: 700,
                fontFamily: fonts.serif,
                lineHeight: 1.3,
              }}
            >
              {stepLabel || apiKey || 'Select an API'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: theme.alt,
              border: `1px solid ${theme.border}`,
              color: theme.muted,
              width: 32,
              height: 32,
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '0 24px 20px', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'flex-end',
              flexShrink: 0,
            }}
          >
            <input
              type="text"
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              placeholder="Add details to narrow down (e.g. must support batch)"
              disabled={loadingRerank}
              style={{
                flex: 1,
                padding: '10px 14px',
                border: `1px solid ${theme.border}`,
                borderRadius: 9,
                fontSize: 13,
                fontFamily: fonts.sans,
                color: theme.ink,
                background: theme.surface,
              }}
            />
            <button
              type="button"
              onClick={handleRefine}
              disabled={loadingRerank || !additionalInfo.trim()}
              style={{
                padding: '10px 18px',
                background: theme.navy,
                color: '#fff',
                border: 'none',
                borderRadius: 9,
                fontSize: 13,
                fontWeight: 600,
                cursor: loadingRerank || !additionalInfo.trim() ? 'not-allowed' : 'pointer',
                fontFamily: fonts.sans,
                opacity: loadingRerank || !additionalInfo.trim() ? 0.7 : 1,
              }}
            >
              {loadingRerank ? 'Refining…' : 'Refine'}
            </button>
          </div>

          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              border: `1px solid ${theme.border}`,
              borderRadius: 10,
              background: theme.alt,
            }}
          >
            {suggestedApis.length === 0 ? (
              <div
                style={{
                  padding: 32,
                  textAlign: 'center',
                  color: theme.muted,
                  fontSize: 14,
                  fontFamily: fonts.sans,
                }}
              >
                No suggested APIs for this step.
              </div>
            ) : (
              <ul style={{ margin: 0, padding: 8, listStyle: 'none' }}>
                {suggestedApis.map((item, index) => {
                  const api = item.api || item;
                  const score = typeof item.score === 'number' ? item.score : item.score ?? 0;
                  const methodStyle = methodColor[api.method] || { bg: theme.alt, col: theme.muted, border: theme.border };
                  const rowKey = `${api.endpoint || ''}-${index}`;
                  const isExpanded = expandedKey === rowKey;
                  return (
                    <li
                      key={rowKey}
                      style={{
                        padding: '12px 14px',
                        borderBottom: index < suggestedApis.length - 1 ? `1px solid ${theme.border}` : 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'stretch',
                        cursor: 'pointer',
                        background: isExpanded ? theme.surface : 'transparent',
                        borderRadius: 6,
                      }}
                      onClick={() => toggleExpanded(rowKey)}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          flexWrap: 'wrap',
                        }}
                      >
                        <span
                          style={{
                            width: 20,
                            color: theme.faint,
                            fontSize: 11,
                            fontFamily: fonts.mono,
                            flexShrink: 0,
                          }}
                        >
                          {isExpanded ? '▼' : '▶'}
                        </span>
                        <span
                          style={{
                            width: 28,
                            color: theme.faint,
                            fontSize: 12,
                            fontFamily: fonts.mono,
                            flexShrink: 0,
                          }}
                        >
                          #{index + 1}
                        </span>
                        <span
                          style={{
                            background: methodStyle.bg,
                            color: methodStyle.col,
                            border: `1px solid ${methodStyle.border}`,
                            borderRadius: 4,
                            padding: '2px 6px',
                            fontSize: 10,
                            fontWeight: 700,
                            fontFamily: fonts.mono,
                            flexShrink: 0,
                          }}
                        >
                          {api.method || '—'}
                        </span>
                        <span
                          style={{
                            flex: 1,
                            minWidth: 0,
                            color: theme.ink,
                            fontSize: 13,
                            fontWeight: 600,
                            fontFamily: fonts.sans,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {api.name || api.endpoint || '—'}
                        </span>
                        <span
                          style={{
                            color: theme.muted,
                            fontSize: 12,
                            fontFamily: fonts.mono,
                            flexShrink: 0,
                          }}
                        >
                          {Math.round(score * 100)}%
                        </span>
                        <span
                          style={{
                            maxWidth: 160,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            color: theme.faint,
                            fontSize: 11,
                            fontFamily: fonts.mono,
                          }}
                        >
                          {api.endpoint || '—'}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelect(item);
                          }}
                          style={{
                            padding: '6px 14px',
                            background: theme.green,
                            color: '#fff',
                            border: 'none',
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: fonts.sans,
                            flexShrink: 0,
                          }}
                        >
                          Use this
                        </button>
                      </div>
                      {isExpanded && (
                        <div
                          style={{
                            marginTop: 8,
                            paddingTop: 12,
                            borderTop: `1px solid ${theme.border}`,
                            paddingLeft: 48,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 10,
                          }}
                        >
                          {api.desc && (
                            <p style={{ margin: 0, color: theme.muted, fontSize: 12, lineHeight: 1.6, fontFamily: fonts.sans }}>
                              {api.desc}
                            </p>
                          )}
                          <div style={{ fontFamily: fonts.mono, fontSize: 11, color: theme.faint, wordBreak: 'break-all' }}>
                            {api.endpoint || '—'}
                          </div>
                          {(api.author || api.team) && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <div style={{ color: theme.faint, fontSize: 10, fontFamily: fonts.mono, letterSpacing: 1 }}>
                                OWNERSHIP
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12, color: theme.ink }}>
                                {api.author && <span>Owner: {api.author}</span>}
                                {api.team && <span>Team: {api.team}</span>}
                              </div>
                            </div>
                          )}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                            {api.status && (
                              <span style={{ fontSize: 11, color: theme.muted }}>Status: {api.status}</span>
                            )}
                            {api.version && (
                              <span style={{ fontSize: 11, color: theme.muted }}>Version: {api.version}</span>
                            )}
                            {api.contract && (
                              <span style={{ fontSize: 11, color: theme.blue }}>Contract: {api.contract}</span>
                            )}
                          </div>
                          {(api.sla || api.latency || api.calls) && (
                            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11, color: theme.muted }}>
                              {api.sla != null && api.sla !== '' && <span>SLA: {api.sla}</span>}
                              {api.latency != null && api.latency !== '' && <span>Latency: {api.latency}</span>}
                              {api.calls != null && api.calls !== '' && <span>Volume: {api.calls}</span>}
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
