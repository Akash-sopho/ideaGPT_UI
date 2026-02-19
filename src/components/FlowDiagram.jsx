import { theme, fonts } from '../config/theme.config';
import { Dot } from './Dot';
import { appConfig } from '../config/app.config';

const NW = 128;
const GAP = 52;

const IOWIDTH = 140;

function getNodeState(apiCatalog, stepId) {
  const raw = apiCatalog[stepId];
  if (raw === undefined || raw === 'loading') return 'loading';
  if (typeof raw !== 'object') return 'none';
  const status = (raw.match_status || '').toLowerCase();
  if (status === 'exact') return 'exact';
  if (status === 'partial') return 'partial';
  return 'none';
}

export function FlowDiagram({
  journey,
  persona,
  apiCatalog,
  stepIO = {},
  onStepIOChange,
  onRematchStep,
  onAPIClick,
  onMissingClick,
}) {
  const steps = journey?.steps || [];
  const cfg = appConfig.diagramScreen || {};

  return (
    <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 0,
          minWidth: steps.length * (NW + IOWIDTH) + Math.max(0, steps.length - 1) * GAP,
          position: 'relative',
        }}
      >
        {steps.map((step, i) => {
          const state = getNodeState(apiCatalog, step.id);
          const ragResult = typeof apiCatalog[step.id] === 'object' ? apiCatalog[step.id] : null;
          const api = ragResult?.matched_api || null;
          const enhancements = ragResult?.enhancements || [];
          const isFound = state === 'exact' || state === 'partial';
          const isLoading = state === 'loading';
          const io = stepIO[step.id] || { input: '', output: '' };

          let borderColor = theme.redBorder;
          let bgColor = theme.redBg;
          let badge = 'needs_build';
          if (isLoading) {
            borderColor = theme.border;
            bgColor = theme.alt;
            badge = null;
          } else if (state === 'exact') {
            borderColor = theme.greenBorder;
            bgColor = theme.greenBg;
            badge = 'live';
          } else if (state === 'partial') {
            borderColor = theme.amberBorder;
            bgColor = theme.amberBg;
            badge = 'enhance';
          }

          const handleClick = () => {
            if (isLoading) return;
            if (isFound && api && onAPIClick) {
              onAPIClick(step.id, api, state === 'partial' ? enhancements : null);
            } else if (state === 'none' && onMissingClick) {
              onMissingClick(step.id);
            }
          };

          const handleInputChange = (e) => {
            if (onStepIOChange) onStepIOChange(step.id, { ...io, input: e.target.value });
          };
          const handleOutputChange = (e) => {
            if (onStepIOChange) onStepIOChange(step.id, { ...io, output: e.target.value });
          };

          return (
            <div key={step.id} style={{ display: 'flex', alignItems: 'flex-start', flex: 'none' }}>
              <div style={{ width: NW + IOWIDTH, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    background: theme.alt,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 20,
                    padding: '4px 10px',
                    marginBottom: 8,
                    maxWidth: NW,
                  }}
                >
                  <span style={{ fontSize: 13 }}>{step.icon}</span>
                  <span
                    style={{
                      fontSize: 10,
                      color: theme.muted,
                      fontFamily: fonts.sans,
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {step.label}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    width: '100%',
                    gap: 6,
                    marginBottom: 6,
                    alignItems: 'flex-start',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 9, color: theme.muted, marginBottom: 2, fontFamily: fonts.sans }}>Input</div>
                    <textarea
                      value={io.input}
                      onChange={handleInputChange}
                      placeholder="Input schema"
                      rows={2}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        fontSize: 9,
                        fontFamily: fonts.mono,
                        padding: 4,
                        border: `1px solid ${theme.border}`,
                        borderRadius: 6,
                        background: theme.surface,
                        color: theme.ink,
                        resize: 'vertical',
                        minHeight: 36,
                      }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 9, color: theme.muted, marginBottom: 2, fontFamily: fonts.sans }}>Output</div>
                    <textarea
                      value={io.output}
                      onChange={handleOutputChange}
                      placeholder="Output schema"
                      rows={2}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        fontSize: 9,
                        fontFamily: fonts.mono,
                        padding: 4,
                        border: `1px solid ${theme.border}`,
                        borderRadius: 6,
                        background: theme.surface,
                        color: theme.ink,
                        resize: 'vertical',
                        minHeight: 36,
                      }}
                    />
                  </div>
                </div>
                {onRematchStep && (
                  <button
                    type="button"
                    onClick={() => onRematchStep(step.id)}
                    style={{
                      fontSize: 9,
                      marginBottom: 6,
                      padding: '2px 8px',
                      fontFamily: fonts.sans,
                      cursor: 'pointer',
                      border: `1px solid ${theme.border}`,
                      borderRadius: 6,
                      background: theme.alt,
                      color: theme.muted,
                    }}
                  >
                    Re-match API
                  </button>
                )}
                <div
                  style={{
                    width: 2,
                    height: 20,
                    background: isLoading ? theme.border : isFound ? theme.green : theme.redBorder,
                  }}
                />
                <div
                  className="hov-node"
                  onClick={handleClick}
                  style={{
                    cursor: isLoading ? 'wait' : isFound || state === 'none' ? 'pointer' : 'default',
                    width: NW,
                    boxSizing: 'border-box',
                    border: `1.5px ${isLoading || state === 'none' ? 'dashed' : 'solid'} ${borderColor}`,
                    borderRadius: 10,
                    padding: '10px 8px',
                    textAlign: 'center',
                    background: bgColor,
                    boxShadow: isFound ? `0 2px 10px ${theme.green}18` : state === 'none' ? `0 2px 10px ${theme.red}10` : 'none',
                    animation: isLoading ? 'pulse 1.2s ease-in-out infinite' : undefined,
                  }}
                >
                  {isLoading && (
                    <>
                      <div style={{ fontSize: 11, color: theme.muted, fontFamily: fonts.sans }}>Loading…</div>
                    </>
                  )}
                  {state === 'exact' && api && (
                    <>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: theme.green,
                          fontFamily: fonts.sans,
                          lineHeight: 1.3,
                          marginBottom: 3,
                        }}
                      >
                        {api.name}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: theme.green + '99',
                          fontFamily: fonts.mono,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {api.latency || '—'}
                      </div>
                      <Dot status="live" />
                    </>
                  )}
                  {state === 'partial' && api && (
                    <>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: theme.amber,
                          fontFamily: fonts.sans,
                          lineHeight: 1.3,
                          marginBottom: 3,
                        }}
                      >
                        {api.name}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: theme.amber + '99',
                          fontFamily: fonts.mono,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {api.latency || '—'}
                      </div>
                      <Dot status="enhance" />
                    </>
                  )}
                  {state === 'none' && (
                    <>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: theme.red,
                          fontFamily: fonts.sans,
                          marginBottom: 2,
                        }}
                      >
                        Not Found
                      </div>
                      <div style={{ fontSize: 10, color: theme.red + '88', fontFamily: fonts.mono }}>
                        Needs build
                      </div>
                      <Dot status="needs_build" />
                    </>
                  )}
                </div>
                {isFound && (
                  <div style={{ fontSize: 9, color: theme.faint, marginTop: 5, fontFamily: fonts.sans }}>
                    click for contract
                  </div>
                )}
              </div>
              {i < steps.length - 1 && (
                <div style={{ display: 'flex', alignItems: 'center', paddingTop: 30, flexShrink: 0 }}>
                  <div
                    style={{
                      width: GAP - 10,
                      height: 2,
                      background: theme.border,
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        right: -1,
                        top: -4,
                        width: 0,
                        height: 0,
                        borderTop: '5px solid transparent',
                        borderBottom: '5px solid transparent',
                        borderLeft: `7px solid ${theme.borderMid}`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
