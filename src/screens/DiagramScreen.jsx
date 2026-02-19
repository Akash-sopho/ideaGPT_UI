import { useState } from 'react';
import { theme, fonts, personaColorMap } from '../config/theme.config';
import { appConfig } from '../config/app.config';
import { FlowDiagram } from '../components/FlowDiagram';

function getPersonaStyle(colorName) {
  const key = (colorName || 'blue').toLowerCase();
  return personaColorMap[key] || personaColorMap.blue;
}

export function DiagramScreen({
  personas,
  apiCatalog,
  coveragePct,
  coveredCount,
  allStepsCount,
  missingApiKeys,
  missingJiraKeys,
  totalDays,
  onViewJira,
  onOpenDrawer,
  onOpenSuggestionsPopup,
  onScrollToJira,
  onRescan,
}) {
  const cfg = appConfig.diagramScreen || {};
  const [activeTab, setActiveTab] = useState(personas?.[0]?.id || '');
  const [activeJourney, setActiveJourney] = useState({});
  const activePersonas = personas || [];
  const currentPersona = activePersonas.find((p) => p.id === activeTab) || activePersonas[0];
  const journeys = currentPersona?.journeys || [];
  const firstJourneyId = journeys[0]?.id;
  const currentJourneyId = activeJourney[currentPersona?.id] || firstJourneyId;
  const currentJourney = journeys.find((j) => j.id === currentJourneyId) || journeys[0];

  if (activeTab && !currentPersona && activePersonas[0]) setActiveTab(activePersonas[0].id);
  if (currentJourneyId && !currentJourney && firstJourneyId)
    setActiveJourney((prev) => ({ ...prev, [currentPersona?.id]: firstJourneyId }));

  const handleOpenDrawer = (api, enhancements) => {
    onOpenDrawer(api, enhancements);
  };

  const handleOpenSuggestionsPopup = (apiKey, api, enhancements) => {
    if (onOpenSuggestionsPopup) {
      onOpenSuggestionsPopup(apiKey, api, enhancements);
    } else {
      onOpenDrawer(api, enhancements);
    }
  };

  return (
    <div className="fu">
      <div
        style={{
          background: coveragePct >= 80 ? theme.greenBg : theme.amberBg,
          border: `1px solid ${coveragePct >= 80 ? theme.greenBorder : theme.amberBorder}`,
          borderRadius: 14,
          padding: '18px 24px',
          marginBottom: 26,
          display: 'flex',
          gap: 20,
          alignItems: 'center',
        }}
      >
        <svg width={70} height={70} viewBox="0 0 70 70" style={{ flexShrink: 0 }}>
          <circle cx={35} cy={35} r={27} fill="none" stroke={theme.border} strokeWidth={7} />
          <circle
            cx={35}
            cy={35}
            r={27}
            fill="none"
            stroke={coveragePct >= 80 ? theme.green : theme.amber}
            strokeWidth={7}
            strokeDasharray={`${(coveragePct / 100) * 2 * Math.PI * 27} ${2 * Math.PI * 27}`}
            strokeDashoffset={2 * Math.PI * 27 * 0.25}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 4px ${coveragePct >= 80 ? theme.green : theme.amber}88)` }}
          />
          <text x={35} y={39} textAnchor="middle" fill={theme.ink} fontSize={13} fontWeight={700} fontFamily={fonts.mono}>
            {coveragePct}%
          </text>
        </svg>
        <div style={{ flex: 1 }}>
          <div
            style={{
              color: theme.ink,
              fontSize: 16,
              fontWeight: 700,
              fontFamily: fonts.serif,
              marginBottom: 4,
            }}
          >
            {coveragePct}% {cfg.coverageTitle}
          </div>
          <div style={{ color: theme.muted, fontSize: 13 }}>
            {coveredCount} of {allStepsCount} {cfg.coverageSub} · {missingApiKeys.length} {cfg.apisNeedBuild}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0, alignItems: 'center' }}>
          {onRescan && (
            <button
              type="button"
              onClick={onRescan}
              style={{
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                color: theme.muted,
                borderRadius: 9,
                padding: '10px 18px',
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: fonts.sans,
                whiteSpace: 'nowrap',
              }}
            >
              {cfg.rescanCta || 'Re-scan'}
            </button>
          )}
          {missingJiraKeys.length > 0 && (
            <button
              onClick={onViewJira}
              style={{
                background: theme.accent,
                color: '#fff',
                border: 'none',
                borderRadius: 9,
                padding: '10px 18px',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: fonts.sans,
                whiteSpace: 'nowrap',
              }}
            >
              {cfg.viewJiraCta}
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 18, marginBottom: 18, flexWrap: 'wrap' }}>
        {[
          [theme.green, theme.greenBg, theme.greenBorder, 'solid', cfg.legendExact],
          [theme.red, theme.redBg, theme.redBorder, 'dashed', cfg.legendNone],
        ].map(([c, bg, border, dash, lbl]) => (
          <div key={lbl} style={{ display: 'flex', gap: 7, alignItems: 'center', fontSize: 12, color: theme.muted }}>
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 3,
                background: bg,
                border: `1.5px ${dash} ${border}`,
              }}
            />
            {lbl}
          </div>
        ))}
        <div style={{ marginLeft: 'auto', color: theme.faint, fontSize: 12, fontFamily: fonts.mono }}>
          {cfg.clickContract}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${theme.border}`, marginBottom: 24 }}>
        {activePersonas.map((p) => (
          <button
            key={p.id}
            onClick={() => setActiveTab(p.id)}
            style={{
              padding: '10px 22px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === p.id ? `2px solid ${theme.navy}` : '2px solid transparent',
              color: activeTab === p.id ? theme.navy : theme.muted,
              fontWeight: activeTab === p.id ? 600 : 400,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              gap: 7,
              alignItems: 'center',
              fontFamily: fonts.sans,
            }}
          >
            <span>{p.icon}</span>
            {p.label}
          </button>
        ))}
      </div>

      {currentPersona && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
            {(currentPersona.journeys || []).map((j) => (
              <button
                key={j.id}
                onClick={() => setActiveJourney((prev) => ({ ...prev, [currentPersona.id]: j.id }))}
                style={{
                  padding: '7px 16px',
                  background: currentJourneyId === j.id ? theme.navy : theme.surface,
                  color: currentJourneyId === j.id ? '#fff' : theme.muted,
                  border: `1px solid ${currentJourneyId === j.id ? theme.navy : theme.border}`,
                  borderRadius: 8,
                  fontSize: 12,
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  fontFamily: fonts.sans,
                }}
              >
                {j.title}
              </button>
            ))}
          </div>
          {currentJourney && (
            <div
              style={{
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: 16,
                padding: 26,
                boxShadow: '0 2px 14px rgba(26,39,68,0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    background: getPersonaStyle(currentPersona.color).colorBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                  }}
                >
                  {currentPersona.icon}
                </div>
                <div>
                  <div style={{ color: theme.ink, fontSize: 14, fontWeight: 700 }}>{currentJourney.title}</div>
                  <div style={{ color: theme.muted, fontSize: 12 }}>
                    {currentPersona.label} · {(currentJourney.steps || []).length} steps
                  </div>
                </div>
                <div
                  style={{
                    marginLeft: 'auto',
                    background: theme.alt,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 7,
                    padding: '4px 12px',
                    fontSize: 12,
                    color: theme.muted,
                    fontFamily: fonts.mono,
                  }}
                >
                  {(currentJourney.steps || []).filter((s) => apiCatalog[s.api] && apiCatalog[s.api] !== 'loading' && apiCatalog[s.api].match_status !== 'none').length}/
                  {(currentJourney.steps || []).length} {cfg.apisMatched}
                </div>
              </div>
              <FlowDiagram
                journey={currentJourney}
                persona={{
                  color: getPersonaStyle(currentPersona.color).color,
                  colorBg: getPersonaStyle(currentPersona.color).colorBg,
                }}
                apiCatalog={apiCatalog}
                onAPIClick={handleOpenSuggestionsPopup}
                onMissingClick={onScrollToJira}
              />
            </div>
          )}
        </>
      )}

      {missingJiraKeys.length > 0 && (
        <div
          style={{
            marginTop: 24,
            background: theme.redBg,
            border: `1px solid ${theme.redBorder}`,
            borderRadius: 14,
            padding: '18px 22px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 14,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ color: theme.red, fontSize: 14, fontWeight: 700, marginBottom: 3 }}>
              {missingJiraKeys.length} {cfg.apisNeedBuild} — {cfg.needsBuildBannerTitle} {totalDays} {cfg.needsBuildBannerSub}
            </div>
            <div style={{ color: theme.muted, fontSize: 13 }}>{cfg.needsBuildBannerBody}</div>
          </div>
          <button
            onClick={onViewJira}
            style={{
              background: theme.red,
              color: '#fff',
              border: 'none',
              borderRadius: 9,
              padding: '10px 22px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              flexShrink: 0,
              fontFamily: fonts.sans,
            }}
          >
            {cfg.viewJiraCta}
          </button>
        </div>
      )}
    </div>
  );
}
