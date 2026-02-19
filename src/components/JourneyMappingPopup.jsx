import { theme, fonts } from '../config/theme.config';
import { Dot } from './Dot';

function getMatchStatus(apiCatalog, stepId) {
  const raw = apiCatalog[stepId];
  if (raw === undefined || raw === 'loading') return 'loading';
  if (typeof raw !== 'object') return 'none';
  const status = (raw.match_status || '').toLowerCase();
  if (status === 'exact') return 'live';
  if (status === 'partial') return 'enhance';
  return 'needs_build';
}

export function JourneyMappingPopup({
  open,
  onClose,
  journey,
  persona,
  stepIO = {},
  apiCatalog = {},
  onStepIOChange,
  onRematchStep,
  onGoToApiMap,
  loadingDescribeForPersonas = false,
}) {
  if (!open) return null;

  const steps = journey?.steps || [];
  const hasMappingData =
    Object.keys(apiCatalog).length > 0 &&
    steps.some((s) => apiCatalog[s.id] !== undefined && apiCatalog[s.id] !== 'loading');
  const journeyStepIds = steps.map((s) => s.id);
  const anyCatalogEntry = journeyStepIds.some(
    (id) => apiCatalog[id] && typeof apiCatalog[id] === 'object'
  );
  const showRematch = anyCatalogEntry && typeof onRematchStep === 'function';

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
          maxWidth: 640,
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
                color: theme.muted,
                fontSize: 11,
                fontFamily: fonts.mono,
                letterSpacing: 1,
                marginBottom: 4,
              }}
            >
              {persona?.label ?? 'Persona'}
            </div>
            <h3
              style={{
                fontFamily: fonts.serif,
                color: theme.ink,
                fontSize: 18,
                margin: 0,
                fontWeight: 700,
              }}
            >
              {journey?.title ?? 'Journey'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 20,
              color: theme.muted,
              cursor: 'pointer',
              padding: 0,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {!hasMappingData && onGoToApiMap && (
          <div
            style={{
              padding: '16px 24px',
              background: theme.amberBg,
              borderBottom: `1px solid ${theme.amberBorder}`,
              flexShrink: 0,
            }}
          >
            <p
              style={{
                margin: '0 0 12px',
                fontSize: 13,
                color: theme.ink,
                fontFamily: fonts.sans,
              }}
            >
              Complete Review and API Map to see and edit API matching.
            </p>
            <button
              type="button"
              onClick={() => {
                onClose?.();
                onGoToApiMap?.();
              }}
              style={{
                background: theme.amber,
                color: theme.surface,
                border: 'none',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: fonts.sans,
              }}
            >
              Continue to Review and API Map
            </button>
          </div>
        )}

        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 24px 24px' }}>
          {steps.length === 0 ? (
            <div
              style={{
                color: theme.muted,
                fontSize: 13,
                fontFamily: fonts.sans,
                textAlign: 'center',
                padding: 24,
              }}
            >
              No steps in this journey.
            </div>
          ) : (
            steps.map((step, i) => {
              const io = stepIO[step.id] || { input: '', output: '' };
              const catalogEntry = apiCatalog[step.id];
              const isLoading = catalogEntry === 'loading';
              const matchStatus = getMatchStatus(apiCatalog, step.id);
              const matchedApi =
                catalogEntry && typeof catalogEntry === 'object'
                  ? catalogEntry.matched_api
                  : null;
              const schemaLoading =
                loadingDescribeForPersonas && !io.input && !io.output;

              return (
                <div
                  key={step.id}
                  style={{
                    border: `1px solid ${theme.border}`,
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: i < steps.length - 1 ? 12 : 0,
                    background: theme.alt,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 10,
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{step.icon}</span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: theme.ink,
                        fontFamily: fonts.sans,
                      }}
                    >
                      {step.label}
                    </span>
                    {hasMappingData && (
                      <span style={{ marginLeft: 'auto' }}>
                        {isLoading ? (
                          <span
                            style={{
                              fontSize: 11,
                              color: theme.muted,
                              fontFamily: fonts.mono,
                            }}
                          >
                            Loading…
                          </span>
                        ) : matchedApi ? (
                          <span
                            style={{
                              fontSize: 11,
                              color: theme.ink,
                              fontFamily: fonts.sans,
                            }}
                          >
                            {matchedApi.name}
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: 11,
                              color: theme.muted,
                              fontFamily: fonts.sans,
                            }}
                          >
                            Not matched yet
                          </span>
                        )}
                        {!isLoading && matchStatus !== 'none' && (
                          <span style={{ marginLeft: 6 }}>
                            <Dot status={matchStatus} />
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <label
                        style={{
                          display: 'block',
                          fontSize: 10,
                          color: theme.muted,
                          marginBottom: 4,
                          fontFamily: fonts.sans,
                        }}
                      >
                        Input
                      </label>
                      <textarea
                        value={io.input}
                        onChange={(e) =>
                          onStepIOChange?.(step.id, { ...io, input: e.target.value })
                        }
                        placeholder={schemaLoading ? 'Loading schemas…' : 'Input schema'}
                        rows={2}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          fontSize: 11,
                          fontFamily: fonts.mono,
                          padding: 8,
                          border: `1px solid ${theme.border}`,
                          borderRadius: 8,
                          background: theme.surface,
                          color: theme.ink,
                          resize: 'vertical',
                          minHeight: 44,
                        }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <label
                        style={{
                          display: 'block',
                          fontSize: 10,
                          color: theme.muted,
                          marginBottom: 4,
                          fontFamily: fonts.sans,
                        }}
                      >
                        Output
                      </label>
                      <textarea
                        value={io.output}
                        onChange={(e) =>
                          onStepIOChange?.(step.id, { ...io, output: e.target.value })
                        }
                        placeholder={schemaLoading ? 'Loading schemas…' : 'Output schema'}
                        rows={2}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          fontSize: 11,
                          fontFamily: fonts.mono,
                          padding: 8,
                          border: `1px solid ${theme.border}`,
                          borderRadius: 8,
                          background: theme.surface,
                          color: theme.ink,
                          resize: 'vertical',
                          minHeight: 44,
                        }}
                      />
                    </div>
                  </div>
                  {showRematch && !isLoading && (
                    <button
                      type="button"
                      onClick={() => onRematchStep?.(step.id)}
                      style={{
                        fontSize: 11,
                        padding: '4px 10px',
                        fontFamily: fonts.sans,
                        cursor: 'pointer',
                        border: `1px solid ${theme.border}`,
                        borderRadius: 6,
                        background: theme.surface,
                        color: theme.muted,
                      }}
                    >
                      Re-match API
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
