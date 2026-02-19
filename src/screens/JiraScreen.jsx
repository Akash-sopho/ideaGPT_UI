import { useState, useRef } from 'react';
import { theme, fonts } from '../config/theme.config';
import { appConfig } from '../config/app.config';
import { Chip } from '../components/Chip';

const priorityStyle = {
  P0: { bg: '#fef2f2', col: theme.red, bdr: theme.redBorder },
  P1: { bg: theme.amberBg, col: theme.amber, bdr: theme.amberBorder },
  P2: { bg: theme.blueBg, col: theme.blue, bdr: theme.blueBorder },
};

export function JiraScreen({
  jiraTickets,
  missingApiKeys,
  onBackToDiagram,
  onCopyStory,
  onCopyAll,
  onExportCsv,
  onPushToJira,
  onRetryJira,
  loadingJira,
}) {
  const cfg = appConfig.jiraScreen;
  const [openJira, setOpenJira] = useState(null);
  const jiraRef = useRef(null);

  const tickets = missingApiKeys
    .map((apiKey) => ({ apiKey, data: jiraTickets[apiKey] }))
    .filter((t) => t.data || t.apiKey);
  const totalDays = tickets.reduce((a, t) => a + (t.data?.days || 0), 0);
  const totalSP = tickets.reduce((a, t) => a + (t.data?.sp || 0), 0);
  const sprintsEst = Math.ceil(totalDays / 10) || 1;

  const handleCopyStory = (est) => {
    const text = `Title: ${est.title}\nEpic: ${est.epic}\nPriority: ${est.priority}\nStory: ${est.story}\nAcceptance:\n${(est.acceptance || []).map((a) => `- ${a}`).join('\n')}`;
    if (onCopyStory) onCopyStory(text);
    else if (navigator.clipboard) navigator.clipboard.writeText(text);
  };

  return (
    <div className="fu">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ color: theme.faint, fontSize: 11, fontFamily: fonts.mono, letterSpacing: 2, marginBottom: 8 }}>
            {cfg.stepLabel}
          </div>
          <h2 style={{ fontFamily: fonts.serif, color: theme.ink, fontSize: 27, margin: '0 0 6px', fontWeight: 700 }}>
            {cfg.title}
          </h2>
          <p style={{ color: theme.muted, fontSize: 14, margin: 0 }}>{cfg.subtitle}</p>
        </div>
        <button
          onClick={onBackToDiagram}
          style={{
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            color: theme.muted,
            borderRadius: 9,
            padding: '9px 18px',
            fontSize: 13,
            cursor: 'pointer',
            flexShrink: 0,
            fontFamily: fonts.sans,
          }}
        >
          {cfg.backToDiagram}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 26 }}>
        {[
          [tickets.length, cfg.missingApis, theme.red, theme.redBg],
          [totalDays, cfg.manDays, theme.amber, theme.amberBg],
          [totalSP, cfg.storyPoints, theme.blue, theme.blueBg],
          [sprintsEst, cfg.sprintsEst, theme.green, theme.greenBg],
        ].map(([v, l, c, bg]) => (
          <div
            key={l}
            style={{
              background: bg,
              border: `1px solid ${c}22`,
              borderRadius: 12,
              padding: 18,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 30, fontWeight: 800, color: c, fontFamily: fonts.mono, lineHeight: 1, marginBottom: 5 }}>
              {v}
            </div>
            <div style={{ color: theme.muted, fontSize: 12 }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} ref={jiraRef}>
        {tickets.map(({ apiKey, data }) => {
          const open = openJira === apiKey;
          const isFailed = !data && !loadingJira;
          const pColor = data ? priorityStyle[data.priority] || {} : {};
          const jiraId = data?.jiraId || `${apiKey.replace(/_/g, '').slice(0, 3).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;

          return (
            <div
              key={apiKey}
              className="hov-card"
              style={{
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: 13,
                overflow: 'hidden',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(26,39,68,0.04)',
              }}
            >
              <div
                onClick={() => setOpenJira(open ? null : apiKey)}
                style={{ padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer' }}
              >
                <div
                  style={{
                    background: theme.alt,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 6,
                    padding: '3px 9px',
                    fontSize: 11,
                    fontFamily: fonts.mono,
                    color: theme.muted,
                    flexShrink: 0,
                  }}
                >
                  {jiraId}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {isFailed ? (
                    <div style={{ color: theme.muted, fontSize: 14 }}>
                      {cfg.generationFailed}
                      {onRetryJira && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRetryJira(apiKey);
                          }}
                          style={{
                            marginLeft: 8,
                            background: 'none',
                            border: 'none',
                            color: theme.blue,
                            textDecoration: 'underline',
                            cursor: 'pointer',
                            fontSize: 13,
                          }}
                        >
                          Retry
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <div style={{ color: theme.ink, fontSize: 14, fontWeight: 600, marginBottom: 5 }}>
                        {data?.title || apiKey}
                      </div>
                      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                        {data?.priority && (
                          <span
                            style={{
                              background: pColor.bg,
                              color: pColor.col,
                              border: `1px solid ${pColor.bdr}`,
                              borderRadius: 4,
                              padding: '2px 8px',
                              fontSize: 11,
                              fontWeight: 700,
                              fontFamily: fonts.mono,
                            }}
                          >
                            {data.priority}
                          </span>
                        )}
                        {data?.epic && <Chip color={theme.muted} bg={theme.alt}>{data.epic}</Chip>}
                        {data?.sprint && (
                          <Chip color={theme.purple} bg={theme.purpleBg} border={theme.purpleBorder}>
                            {data.sprint}
                          </Chip>
                        )}
                        {data?.squad && (
                          <Chip color={theme.navy} bg={theme.blueBg} border={theme.blueBorder}>
                            {data.squad}
                          </Chip>
                        )}
                      </div>
                    </>
                  )}
                </div>
                {data && (
                  <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          background: theme.amberBg,
                          color: theme.amber,
                          border: `1px solid ${theme.amberBorder}`,
                          borderRadius: 7,
                          padding: '5px 13px',
                          fontFamily: fonts.mono,
                          fontWeight: 700,
                          fontSize: 15,
                        }}
                      >
                        {data.days}d
                      </div>
                      <div style={{ color: theme.faint, fontSize: 10, marginTop: 2 }}>man-days</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          background: theme.blueBg,
                          color: theme.blue,
                          border: `1px solid ${theme.blueBorder}`,
                          borderRadius: 7,
                          padding: '5px 13px',
                          fontFamily: fonts.mono,
                          fontWeight: 700,
                          fontSize: 15,
                        }}
                      >
                        {data.sp}
                      </div>
                      <div style={{ color: theme.faint, fontSize: 10, marginTop: 2 }}>story pts</div>
                    </div>
                  </div>
                )}
                <div style={{ color: theme.faint, fontSize: 13 }}>{open ? '▲' : '▼'}</div>
              </div>
              {open && data && (
                <div style={{ borderTop: `1px solid ${theme.border}`, padding: '18px 20px', background: theme.alt }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 16 }}>
                    <div>
                      <div
                        style={{
                          color: theme.faint,
                          fontSize: 11,
                          fontFamily: fonts.mono,
                          letterSpacing: 1.5,
                          marginBottom: 7,
                        }}
                      >
                        {cfg.userStory}
                      </div>
                      <p
                        style={{
                          color: theme.ink,
                          fontSize: 13,
                          lineHeight: 1.7,
                          margin: 0,
                          fontStyle: 'italic',
                          fontFamily: fonts.serif,
                        }}
                      >
                        {data.story}
                      </p>
                    </div>
                    <div>
                      <div
                        style={{
                          color: theme.faint,
                          fontSize: 11,
                          fontFamily: fonts.mono,
                          letterSpacing: 1.5,
                          marginBottom: 7,
                        }}
                      >
                        {cfg.acceptanceCriteria}
                      </div>
                      <ul style={{ margin: 0, padding: '0 0 0 16px', color: theme.muted, fontSize: 13, lineHeight: 1.8 }}>
                        {(data.acceptance || []).map((a, i) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  {(data.deps || []).length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div
                        style={{
                          color: theme.faint,
                          fontSize: 11,
                          fontFamily: fonts.mono,
                          letterSpacing: 1.5,
                          marginBottom: 7,
                        }}
                      >
                        {cfg.dependencies}
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {(data.deps || []).map((d) => (
                          <div
                            key={d}
                            style={{
                              background: theme.surface,
                              border: `1px solid ${theme.border}`,
                              borderRadius: 6,
                              padding: '4px 11px',
                              fontSize: 12,
                              color: theme.ink,
                              display: 'flex',
                              gap: 5,
                              alignItems: 'center',
                            }}
                          >
                            <span style={{ color: theme.amber }}>⚠</span>
                            {d}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 9 }}>
                    <button
                      onClick={() => handleCopyStory(data)}
                      style={{
                        background: theme.surface,
                        border: `1px solid ${theme.border}`,
                        color: theme.muted,
                        borderRadius: 7,
                        padding: '7px 15px',
                        fontSize: 12,
                        cursor: 'pointer',
                        fontFamily: fonts.sans,
                      }}
                    >
                      📋 {cfg.copyStory}
                    </button>
                    <button
                      onClick={() => onPushToJira && onPushToJira(apiKey, data)}
                      style={{
                        background: theme.navy,
                        color: '#fff',
                        border: 'none',
                        borderRadius: 7,
                        padding: '7px 15px',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: fonts.sans,
                      }}
                    >
                      🎯 {cfg.createInJira}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 24,
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: 14,
          padding: '20px 26px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              color: theme.ink,
              fontSize: 14,
              fontWeight: 700,
              marginBottom: 3,
              fontFamily: fonts.serif,
            }}
          >
            {cfg.totalEstimate} <span style={{ color: theme.accent }}>{totalDays} man-days</span> across {sprintsEst}{' '}
            {cfg.sprints}
          </div>
          <div style={{ color: theme.muted, fontSize: 13 }}>{cfg.totalEstimateSub}</div>
        </div>
        <div style={{ display: 'flex', gap: 9 }}>
          <button
            onClick={() => onExportCsv && onExportCsv(tickets)}
            style={{
              background: theme.surface,
              color: theme.ink,
              border: `1px solid ${theme.border}`,
              borderRadius: 8,
              padding: '8px 15px',
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: fonts.sans,
            }}
          >
            📊 {cfg.exportCsv}
          </button>
          <button
            onClick={() => {
              const text = tickets
                .filter((t) => t.data)
                .map(
                  (t) =>
                    `${t.data.title}\t${t.data.epic}\t${t.data.priority}\t${t.data.story}\t${(t.data.acceptance || []).join('; ')}`
                )
                .join('\n');
              if (onCopyAll) onCopyAll(text);
              else if (navigator.clipboard) navigator.clipboard.writeText(text);
            }}
            style={{
              background: theme.surface,
              color: theme.ink,
              border: `1px solid ${theme.border}`,
              borderRadius: 8,
              padding: '8px 15px',
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: fonts.sans,
            }}
          >
            📋 {cfg.copyAll}
          </button>
          <button
            onClick={() => onPushToJira && onPushToJira(null, tickets.filter((t) => t.data).map((t) => t.data))}
            style={{
              background: theme.navy,
              color: '#fff',
              border: `1px solid ${theme.navy}`,
              borderRadius: 8,
              padding: '8px 15px',
              fontSize: 12,
              cursor: 'pointer',
              fontWeight: 600,
              fontFamily: fonts.sans,
            }}
          >
            🎯 {cfg.pushToJira}
          </button>
        </div>
      </div>
    </div>
  );
}
