import { useState, useCallback } from 'react';
import { theme, fonts, personaColorMap } from './config/theme.config';
import { appConfig } from './config/app.config';
import { scanConfig } from './config/scan.config';
import { fetchFeatures } from './api/features';
import { sendChat, summariseIdea } from './api/chat';
import { suggestPersonas } from './api/personas';
import { generateJourneys } from './api/journeys';
import { describeApiKey } from './api/describe';
import { ragLookup } from './api/rag';
import { generateJiraTicket } from './api/jira';
import { Steps } from './components/Steps';
import { Drawer } from './components/Drawer';
import { IdeaScreen } from './screens/IdeaScreen';
import { FeaturesScreen } from './screens/FeaturesScreen';
import { PersonaSuggestionScreen } from './screens/PersonaSuggestionScreen';
import { PersonasScreen } from './screens/PersonasScreen';
import { ReviewScreen } from './screens/ReviewScreen';
import { ScanningScreen } from './screens/ScanningScreen';
import { DiagramScreen } from './screens/DiagramScreen';
import { JiraScreen } from './screens/JiraScreen';

const PHASES = ['idea', 'features', 'persona-suggestion', 'personas', 'review', 'scanning', 'diagram', 'jira'];

function getPersonaTheme(colorName) {
  const key = (colorName || 'blue').toLowerCase();
  return personaColorMap[key] || personaColorMap.blue;
}

export default function App() {
  const [phase, setPhase] = useState('idea');
  const [idea, setIdea] = useState('');
  const [ideaSummary, setIdeaSummary] = useState('');
  const [features, setFeatures] = useState([]);
  const [personaSuggestions, setPersonaSuggestions] = useState([]);
  const [confirmedPersonas, setConfirmedPersonas] = useState([]);
  const [personas, setPersonas] = useState([]);
  const [uniqueApiKeys, setUniqueApiKeys] = useState([]);
  const [apiCatalog, setApiCatalog] = useState({});
  const [descriptionCache, setDescriptionCache] = useState({});
  const [jiraTickets, setJiraTickets] = useState({});
  const [chatMessages, setChatMessages] = useState([]);
  const [summaryResult, setSummaryResult] = useState(null);
  const [loadingChat, setLoadingChat] = useState(false);
  const [loadingSummarise, setLoadingSummarise] = useState(false);
  const [loadingFeatures, setLoadingFeatures] = useState(false);
  const [loadingPersonaSuggestions, setLoadingPersonaSuggestions] = useState(false);
  const [loadingJourneys, setLoadingJourneys] = useState(false);
  const [scanProgress, setScanProgress] = useState({ total: 0, done: 0, current: '' });
  const [loadingJira, setLoadingJira] = useState(false);
  const [errors, setErrors] = useState({
    chat: null,
    summarise: null,
    features: null,
    personaSuggestions: null,
    journeys: null,
    scan: null,
    jira: null,
  });
  const [drawerAPI, setDrawerAPI] = useState(null);
  const [drawerEnhancements, setDrawerEnhancements] = useState(null);
  const [activeTab, setActiveTab] = useState('');
  const [activeJourney, setActiveJourney] = useState({});

  const clearError = (key) => setErrors((e) => ({ ...e, [key]: null }));

  const handleSendMessage = useCallback(
    async (content) => {
      const trimmed = (content || '').trim();
      if (!trimmed || loadingChat) return;
      const newUserMessage = { role: 'user', content: trimmed };
      const nextMessages = [...chatMessages, newUserMessage];
      setChatMessages(nextMessages);
      setLoadingChat(true);
      setErrors((e) => ({ ...e, chat: null }));
      try {
        const res = await sendChat({ messages: nextMessages, idea_context: idea });
        setChatMessages((prev) => [...prev, { role: 'assistant', content: res.reply || '' }]);
      } catch (err) {
        setErrors((e) => ({ ...e, chat: appConfig.ideaScreen?.errors?.chat || appConfig.errors?.chat || 'Could not send message' }));
        setChatMessages((prev) => prev.slice(0, -1));
      } finally {
        setLoadingChat(false);
      }
    },
    [chatMessages, idea, loadingChat]
  );

  const handleSummarise = useCallback(async () => {
    let messages = [...chatMessages];
    if (messages.length === 0 && idea.trim()) {
      messages = [{ role: 'user', content: idea.trim() }];
    }
    if (messages.length === 0) return;
    setLoadingSummarise(true);
    setErrors((e) => ({ ...e, summarise: null }));
    try {
      const res = await summariseIdea({ messages });
      setSummaryResult(res);
    } catch (err) {
      setErrors((e) => ({ ...e, summarise: appConfig.ideaScreen?.errors?.summarise || appConfig.errors?.summarise || 'Could not summarise' }));
    } finally {
      setLoadingSummarise(false);
    }
  }, [chatMessages, idea]);

  const handleContinueChat = useCallback(() => {
    setSummaryResult(null);
  }, []);

  const handleContinueToFeatures = useCallback(async () => {
    if (!summaryResult?.idea) return;
    setLoadingFeatures(true);
    setErrors((e) => ({ ...e, features: null }));
    try {
      setIdea(summaryResult.idea);
      setIdeaSummary(summaryResult.idea_summary || '');
      const res = await fetchFeatures(summaryResult.idea);
      setFeatures(res.features || []);
      if (res.idea_summary && !summaryResult.idea_summary) setIdeaSummary(res.idea_summary);
      setPhase('features');
    } catch (err) {
      setErrors((e) => ({ ...e, features: appConfig.errors?.features || 'Could not analyse idea' }));
    } finally {
      setLoadingFeatures(false);
    }
  }, [summaryResult]);

  const handleMapJourneys = useCallback(async () => {
    const selectedFeatures = features.filter((f) => f.on).map((f) => f.title);
    setLoadingPersonaSuggestions(true);
    setErrors((e) => ({ ...e, personaSuggestions: null }));
    try {
      const res = await suggestPersonas({ idea, ideaSummary, selectedFeatures });
      const suggestions = (res.personas || []).map((p) => ({
        ...p,
        colorBg: getPersonaTheme(p.color).colorBg,
        colorBorder: getPersonaTheme(p.color).colorBorder,
        selected: true,
      }));
      setPersonaSuggestions(suggestions);
      setConfirmedPersonas(suggestions);
      setPhase('persona-suggestion');
    } catch (err) {
      setErrors((e) => ({ ...e, personaSuggestions: appConfig.errors?.personaSuggestions || 'Could not suggest personas' }));
    } finally {
      setLoadingPersonaSuggestions(false);
    }
  }, [idea, ideaSummary, features]);

  const handleConfirmPersonas = useCallback(
    async (selectedList) => {
      const selectedFeatures = features.filter((f) => f.on).map((f) => f.title);
      setLoadingJourneys(true);
      setErrors((e) => ({ ...e, journeys: null }));
      try {
        const confirmed = selectedList.map((p) => ({
          id: p.id,
          label: p.label,
          icon: p.icon,
          desc: p.desc,
          color: p.color,
          suggested_journeys: p.suggested_journeys || [],
        }));
        const res = await generateJourneys({ idea, selectedFeatures, confirmedPersonas: confirmed });
        const rawPersonas = res.personas || [];
        const merged = rawPersonas.map((p) => {
          const confirmedP = selectedList.find((c) => c.id === p.id);
          const style = getPersonaTheme(confirmedP?.color || p.color);
          return {
            ...p,
            label: confirmedP?.label ?? p.label ?? p.id,
            icon: confirmedP?.icon ?? p.icon ?? '👤',
            desc: confirmedP?.desc ?? p.desc ?? '',
            color: confirmedP?.color ?? p.color ?? 'blue',
            colorBg: style.colorBg,
            colorBorder: style.colorBorder,
          };
        });
        setPersonas(merged);
        setUniqueApiKeys(res.unique_api_keys || []);
        setPhase('personas');
      } catch (err) {
        setErrors((e) => ({ ...e, journeys: appConfig.errors?.journeys || 'Could not generate journeys' }));
      } finally {
        setLoadingJourneys(false);
      }
    },
    [idea, features]
  );

  const doScan = useCallback(async () => {
    setPhase('scanning');
    setErrors((e) => ({ ...e, scan: null }));
    const keys = uniqueApiKeys.length ? uniqueApiKeys : [];
    if (keys.length === 0) {
      setPhase('diagram');
      return;
    }

    const stepContextByKey = {};
    personas.forEach((persona) => {
      (persona.journeys || []).forEach((journey) => {
        (journey.steps || []).forEach((step) => {
          if (step.api && !stepContextByKey[step.api]) {
            stepContextByKey[step.api] = {
              step_label: step.label,
              persona_label: persona.label,
              journey_title: journey.title,
            };
          }
        });
      });
    });

    const batchSize = scanConfig.batchSize || 10;
    const messages = scanConfig.loadingMessages || [];

    setScanProgress({ total: keys.length * 2, done: 0, current: messages[0] });

    const localDescCache = {};

    try {
      for (let i = 0; i < keys.length; i += batchSize) {
        const batch = keys.slice(i, i + batchSize);
        const describePromises = batch.map((api_key) => {
          const ctx = stepContextByKey[api_key] || {};
          return describeApiKey({
            api_key,
            idea,
            step_label: ctx.step_label,
            persona_label: ctx.persona_label,
            journey_title: ctx.journey_title,
          });
        });
        const results = await Promise.all(describePromises);
        results.forEach((r) => {
          if (r && r.api_key) {
            localDescCache[r.api_key] = {
              description: r.description,
              input_schema: r.input_schema,
              output_schema: r.output_schema,
            };
          }
        });
        setDescriptionCache((prev) => ({ ...prev, ...localDescCache }));
        setScanProgress((p) => ({
          ...p,
          done: p.done + batch.length,
          current: messages[Math.min(Math.floor((p.done + batch.length) / keys.length * messages.length), messages.length - 1)],
        }));
      }

      keys.forEach((key) => setApiCatalog((c) => ({ ...c, [key]: 'loading' })));

      const ragPromises = keys.map(async (api_key) => {
        const desc = localDescCache[api_key] || {};
        const ctx = stepContextByKey[api_key] || {};
        try {
          const result = await ragLookup({
            query_key: api_key,
            description: desc.description,
            context: {
              product_idea: idea,
              persona: ctx.persona_label,
              journey: ctx.journey_title,
              step_label: ctx.step_label,
            },
            expected_io: {
              input_schema: desc.input_schema,
              output_schema: desc.output_schema,
            },
          });
          return { api_key, result };
        } catch (err) {
          return { api_key, result: { query_key: api_key, match_status: 'none', build_required: true } };
        }
      });

      const ragResults = await Promise.all(ragPromises);
      const catalogUpdate = {};
      ragResults.forEach(({ api_key, result }) => {
        catalogUpdate[api_key] = result;
      });
      setApiCatalog((c) => ({ ...c, ...catalogUpdate }));
      setScanProgress((p) => ({ ...p, done: p.total, current: messages[messages.length - 1] || p.current }));
      setPhase('diagram');

      const missingSet = new Set(
        ragResults
          .filter((r) => r.result?.match_status === 'none' || r.result?.build_required)
          .map((r) => r.api_key)
      );

      const allSteps = [];
      personas.forEach((persona) => {
        (persona.journeys || []).forEach((journey) => {
          (journey.steps || []).forEach((step) => {
            allSteps.push({
              api_key: step.api,
              step_label: step.label,
              journey_title: journey.title,
              persona_label: persona.label,
            });
          });
        });
      });
      const stepsByApiKey = {};
      allSteps.forEach((s) => {
        if (!stepsByApiKey[s.api_key]) stepsByApiKey[s.api_key] = [];
        stepsByApiKey[s.api_key].push({
          step_label: s.step_label,
          journey_title: s.journey_title,
          persona_label: s.persona_label,
        });
      });
      const journeyCount = personas.reduce((a, p) => a + (p.journeys || []).length, 0);
      const halfJourneys = journeyCount / 2;

      missingSet.forEach((api_key) => {
        const affected = stepsByApiKey[api_key] || [];
        const stepCount = affected.length;
        const suggested_priority = stepCount > halfJourneys ? 'P0' : 'P1';
        const ragResult = catalogUpdate[api_key] || {};
        generateJiraTicket({
          api_key,
          idea,
          affected_steps: affected,
          rag_gap_summary: ragResult.gap_summary || '',
          rag_enhancements: ragResult.enhancements || [],
          suggested_priority,
        })
          .then((ticket) => {
            setJiraTickets((prev) => ({ ...prev, [api_key]: ticket }));
          })
          .catch(() => {
            setJiraTickets((prev) => ({ ...prev, [api_key]: null }));
          });
      });
    } catch (err) {
      setErrors((e) => ({ ...e, scan: appConfig.errors?.scan || 'Scan failed' }));
      setPhase('review');
    }
  }, [idea, personas, uniqueApiKeys]);

  const allSteps = personas.flatMap((p) => (p.journeys || []).flatMap((j) => (j.steps || [])));
  const covered = allSteps.filter((s) => {
    const r = apiCatalog[s.api];
    return r && r !== 'loading' && r.match_status !== 'none';
  });
  const coveragePct = allSteps.length ? Math.round((covered.length / allSteps.length) * 100) : 0;
  const missingApiKeys = [...new Set(allSteps.filter((s) => !apiCatalog[s.api] || apiCatalog[s.api] === 'loading' || apiCatalog[s.api].match_status === 'none').map((s) => s.api))];
  const missingJiraKeys = missingApiKeys.filter((k) => apiCatalog[k] && apiCatalog[k] !== 'loading' && (apiCatalog[k].match_status === 'none' || apiCatalog[k].build_required));
  const totalDays = missingJiraKeys.reduce((a, k) => a + (jiraTickets[k]?.days || 0), 0);

  const openDrawer = (api, enhancements) => {
    setDrawerAPI(api);
    setDrawerEnhancements(enhancements || null);
  };

  const header = (
    <div
      style={{
        background: theme.surface,
        borderBottom: `1px solid ${theme.border}`,
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: theme.navy,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
            }}
          >
            💡
          </div>
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              fontFamily: fonts.serif,
              color: theme.ink,
              letterSpacing: -0.3,
            }}
          >
            {appConfig.header?.appName || 'IdeaGPT'}
          </span>
          <span
            style={{
              background: theme.alt,
              color: theme.muted,
              border: `1px solid ${theme.border}`,
              borderRadius: 100,
              padding: '2px 9px',
              fontSize: 11,
              fontFamily: fonts.mono,
            }}
          >
            {appConfig.header?.badge || 'ENTERPRISE'}
          </span>
        </div>
        {phase !== 'idea' && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {phase === 'diagram' && (
              <div
                style={{
                  background: theme.greenBg,
                  border: `1px solid ${theme.greenBorder}`,
                  borderRadius: 8,
                  padding: '6px 14px',
                  display: 'flex',
                  gap: 7,
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: theme.green,
                    display: 'inline-block',
                  }}
                />
                <span style={{ color: theme.green, fontSize: 13, fontWeight: 600 }}>
                  {coveragePct}% {appConfig.header?.coverageLabel || 'API Coverage'}
                </span>
              </div>
            )}
            <button
              onClick={() => setPhase('idea')}
              style={{
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                color: theme.muted,
                borderRadius: 8,
                padding: '7px 14px',
                cursor: 'pointer',
                fontSize: 13,
                fontFamily: fonts.sans,
              }}
            >
              {appConfig.header?.startOver || '← Start Over'}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, fontFamily: fonts.sans }}>
      {header}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 80px' }}>
        {phase !== 'idea' && phase !== 'scanning' && <Steps phase={phase} />}

        {phase === 'idea' && (
          <IdeaScreen
            idea={idea}
            setIdea={setIdea}
            chatMessages={chatMessages}
            onSendMessage={handleSendMessage}
            loadingChat={loadingChat}
            onSummarise={handleSummarise}
            loadingSummarise={loadingSummarise}
            summaryResult={summaryResult}
            onContinueChat={handleContinueChat}
            onContinueToFeatures={handleContinueToFeatures}
            loadingFeatures={loadingFeatures}
            errorChat={errors.chat}
            errorSummarise={errors.summarise}
            errorFeatures={errors.features}
          />
        )}

        {phase === 'features' && (
          <FeaturesScreen
            idea={idea}
            features={features}
            setFeatures={setFeatures}
            onMapJourneys={handleMapJourneys}
            loading={loadingPersonaSuggestions}
            error={errors.personaSuggestions}
            onRetry={() => { clearError('personaSuggestions'); handleMapJourneys(); }}
          />
        )}

        {phase === 'persona-suggestion' && (
          <PersonaSuggestionScreen
            personaSuggestions={personaSuggestions}
            confirmedPersonas={confirmedPersonas}
            setConfirmedPersonas={setConfirmedPersonas}
            onConfirm={handleConfirmPersonas}
            loading={loadingJourneys}
            error={errors.journeys}
            onRetry={() => { clearError('journeys'); setPhase('features'); }}
          />
        )}

        {phase === 'personas' && (
          <PersonasScreen
            personas={personas}
            onReview={() => setPhase('review')}
            onBack={() => setPhase('persona-suggestion')}
          />
        )}

        {phase === 'review' && (
          <ReviewScreen
            idea={idea}
            features={features}
            personas={personas}
            onScan={doScan}
            onBack={() => setPhase('personas')}
          />
        )}

        {phase === 'scanning' && (
          <ScanningScreen
            scanProgress={{
              ...scanProgress,
              total: uniqueApiKeys.length * 2,
              done: scanProgress.done,
              current: scanProgress.current,
            }}
          />
        )}

        {phase === 'diagram' && (
          <DiagramScreen
            personas={personas}
            apiCatalog={apiCatalog}
            coveragePct={coveragePct}
            coveredCount={covered.length}
            allStepsCount={allSteps.length}
            missingApiKeys={missingApiKeys}
            missingJiraKeys={missingJiraKeys}
            totalDays={totalDays}
            onViewJira={() => setPhase('jira')}
            onOpenDrawer={openDrawer}
            onScrollToJira={() => setPhase('jira')}
          />
        )}

        {phase === 'jira' && (
          <JiraScreen
            jiraTickets={jiraTickets}
            missingApiKeys={missingJiraKeys}
            onBackToDiagram={() => setPhase('diagram')}
            onPushToJira={() => {}}
          />
        )}
      </div>
      <Drawer
        api={drawerAPI}
        enhancements={drawerEnhancements}
        onClose={() => {
          setDrawerAPI(null);
          setDrawerEnhancements(null);
        }}
      />
    </div>
  );
}
