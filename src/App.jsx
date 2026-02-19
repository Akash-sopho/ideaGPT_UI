import { useState, useCallback, useEffect, useRef } from 'react';
import { theme, fonts, personaColorMap } from './config/theme.config';
import { appConfig } from './config/app.config';
import { scanConfig } from './config/scan.config';
import { fetchFeatures } from './api/features';
import { sendChat, summariseIdea } from './api/chat';
import { suggestPersonas } from './api/personas';
import { generateJourneys } from './api/journeys';
import { describeApiKey } from './api/describe';
import { getStepIO } from './api/stepIo';
import { ragLookup, ragRerank } from './api/rag';
import { generateJiraTicket } from './api/jira';
import { Steps } from './components/Steps';
import { Drawer } from './components/Drawer';
import { APISuggestionsPopup } from './components/APISuggestionsPopup';
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

function getStepIndex(phase) {
  const idx = appConfig.steps.findIndex((s) => s.phase === phase);
  return idx >= 0 ? idx : -1;
}

/** Fetches describe results per api_key (description only for RAG) and step I/O from direct LLM per step. No chaining. */
async function fetchDescriptionsAndStepIO(personas, idea, keys) {
  if (!keys || keys.length === 0) return { localDescCache: {}, stepIOUpdate: {} };
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
  const localDescCache = {};
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
  }
  const stepIOUpdate = {};
  const allSteps = [];
  personas.forEach((persona) => {
    (persona.journeys || []).forEach((journey) => {
      (journey.steps || []).forEach((step) => {
        allSteps.push({
          step,
          persona_label: persona.label,
          journey_title: journey.title,
        });
      });
    });
  });
  for (let i = 0; i < allSteps.length; i += batchSize) {
    const batch = allSteps.slice(i, i + batchSize);
    const stepIOPromises = batch.map(({ step, persona_label, journey_title }) =>
      getStepIO({
        idea,
        persona_label,
        journey_title,
        step_label: step.label,
        api_key: step.api || '',
      })
    );
    const stepIOResults = await Promise.all(stepIOPromises);
    batch.forEach(({ step }, idx) => {
      const res = stepIOResults[idx];
      stepIOUpdate[step.id] = {
        input: (res && res.input_schema) || '',
        output: (res && res.output_schema) || '',
      };
    });
  }
  return { localDescCache, stepIOUpdate };
}

export default function App() {
  const [phase, setPhase] = useState('idea');
  const [maxReachedPhase, setMaxReachedPhase] = useState('idea');
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
  const [stepIO, setStepIO] = useState({});
  const [suggestionsPopupStepId, setSuggestionsPopupStepId] = useState(null);
  const [loadingRerank, setLoadingRerank] = useState(false);
  const [loadingDescribeForPersonas, setLoadingDescribeForPersonas] = useState(false);
  const [activeTab, setActiveTab] = useState('');
  const [activeJourney, setActiveJourney] = useState({});
  const apiCatalogRef = useRef(apiCatalog);
  apiCatalogRef.current = apiCatalog;
  const describeCancelRef = useRef(false);

  const clearError = (key) => setErrors((e) => ({ ...e, [key]: null }));

  const clearProgressAfter = useCallback((upToPhase) => {
    switch (upToPhase) {
      case 'idea':
        setFeatures([]);
        setIdeaSummary('');
        setPersonaSuggestions([]);
        setConfirmedPersonas([]);
        setPersonas([]);
        setUniqueApiKeys([]);
        setApiCatalog({});
        setDescriptionCache({});
        setStepIO({});
        setJiraTickets({});
        setScanProgress({ total: 0, done: 0, current: '' });
        setLoadingPersonaSuggestions(false);
        setLoadingJourneys(false);
        setLoadingJira(false);
        setErrors((e) => ({
          ...e,
          features: null,
          personaSuggestions: null,
          journeys: null,
          scan: null,
          jira: null,
        }));
        break;
      case 'features':
        setPersonaSuggestions([]);
        setConfirmedPersonas([]);
        setPersonas([]);
        setUniqueApiKeys([]);
        setApiCatalog({});
        setDescriptionCache({});
        setStepIO({});
        setJiraTickets({});
        setScanProgress({ total: 0, done: 0, current: '' });
        setLoadingPersonaSuggestions(false);
        setLoadingJourneys(false);
        setLoadingJira(false);
        setErrors((e) => ({
          ...e,
          personaSuggestions: null,
          journeys: null,
          scan: null,
          jira: null,
        }));
        break;
      case 'persona-suggestion':
        setPersonas([]);
        setUniqueApiKeys([]);
        setApiCatalog({});
        setDescriptionCache({});
        setStepIO({});
        setJiraTickets({});
        setScanProgress({ total: 0, done: 0, current: '' });
        setLoadingJourneys(false);
        setLoadingJira(false);
        setErrors((e) => ({ ...e, journeys: null, scan: null, jira: null }));
        break;
      case 'personas':
      case 'review':
        setApiCatalog({});
        setDescriptionCache({});
        setStepIO({});
        setJiraTickets({});
        setScanProgress({ total: 0, done: 0, current: '' });
        setLoadingJira(false);
        setErrors((e) => ({ ...e, scan: null, jira: null }));
        break;
      case 'diagram':
        setJiraTickets({});
        setLoadingJira(false);
        setErrors((e) => ({ ...e, jira: null }));
        break;
      case 'jira':
        setErrors((e) => ({ ...e, jira: null }));
        break;
      default:
        break;
    }
    setPhase(upToPhase);
    setMaxReachedPhase(upToPhase);
  }, []);

  useEffect(() => {
    const phaseForMax = phase === 'scanning' ? 'review' : phase;
    const phaseIdx = getStepIndex(phaseForMax);
    const maxIdx = getStepIndex(maxReachedPhase);
    if (phaseIdx > maxIdx) {
      setMaxReachedPhase(phaseForMax);
    }
  }, [phase, maxReachedPhase]);

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
        const ideaContext = idea.trim() || (nextMessages.find((m) => m.role === 'user')?.content?.trim() ?? '');
        const res = await sendChat({ messages: nextMessages, idea_context: ideaContext });
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
    const selected = features.filter((f) => f.on);
    const selectedFeatures = selected.map((f) => f.title);
    const selectedFeatureDescriptions = selected.map((f) => ({ title: f.title, description: f.desc || '' }));
    setLoadingPersonaSuggestions(true);
    setErrors((e) => ({ ...e, personaSuggestions: null }));
    try {
      const res = await suggestPersonas({ idea, ideaSummary, selectedFeatures, selectedFeatureDescriptions });
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
      const selected = features.filter((f) => f.on);
      const selectedFeatures = selected.map((f) => f.title);
      const selectedFeatureDescriptions = selected.map((f) => ({ title: f.title, description: f.desc || '' }));
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
        const res = await generateJourneys({ idea, selectedFeatures, selectedFeatureDescriptions, confirmedPersonas: confirmed });
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

    const messages = scanConfig.loadingMessages || [];
    setScanProgress({ total: keys.length, done: 0, current: messages[0] });

    try {
      const { localDescCache, stepIOUpdate } = await fetchDescriptionsAndStepIO(personas, idea, keys);
      setDescriptionCache((prev) => ({ ...prev, ...localDescCache }));
      setStepIO((prev) => ({ ...prev, ...stepIOUpdate }));

      const allStepsForRag = [];
      personas.forEach((persona) => {
        (persona.journeys || []).forEach((journey) => {
          (journey.steps || []).forEach((step) => {
            allStepsForRag.push({ step, persona, journey });
          });
        });
      });

      allStepsForRag.forEach(({ step }) => {
        setApiCatalog((c) => ({ ...c, [step.id]: 'loading' }));
      });
      setScanProgress((p) => ({
        ...p,
        total: keys.length + allStepsForRag.length,
        done: keys.length,
        current: messages[0] || p.current,
      }));

      const ragPromises = allStepsForRag.map(async ({ step, persona, journey }) => {
        const desc = localDescCache[step.api] || {};
        const expected_io = {
          input_schema: stepIOUpdate[step.id]?.input ?? '',
          output_schema: stepIOUpdate[step.id]?.output ?? '',
        };
        const context = {
          product_idea: idea,
          persona: persona.label,
          journey: journey.title,
          step_label: step.label,
        };
        try {
          const result = await ragLookup({
            query_key: step.id,
            description: desc.description,
            context,
            expected_io,
          });
          return {
            stepId: step.id,
            api_key: step.api,
            result,
            _query: { description: desc.description, context, expected_io },
          };
        } catch (err) {
          return {
            stepId: step.id,
            api_key: step.api,
            result: {
              query_key: step.id,
              match_status: 'none',
              build_required: true,
              suggested_apis: [],
            },
            _query: { description: desc.description, context, expected_io },
          };
        }
      });

      const ragResults = await Promise.all(ragPromises);
      const catalogUpdate = {};
      ragResults.forEach(({ stepId, result, _query }) => {
        catalogUpdate[stepId] = { ...result, _query };
      });
      setApiCatalog((c) => ({ ...c, ...catalogUpdate }));
      setScanProgress((p) => ({
        ...p,
        done: p.total,
        current: messages[messages.length - 1] || p.current,
      }));
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
              step_id: step.id,
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
        const ragResultForKey = ragResults.find((r) => r.api_key === api_key);
        const ragResult = ragResultForKey ? catalogUpdate[ragResultForKey.stepId] : {};
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

  const handleScan = useCallback(() => {
    clearProgressAfter('review');
    doScan();
  }, [clearProgressAfter, doScan]);

  // Populate stepIO (input/output schema) when user reaches Journeys screen so the mapping popup shows schemas without running API Map first.
  useEffect(() => {
    const allSteps = personas.flatMap((p) => (p.journeys || []).flatMap((j) => (j.steps || [])));
    const stepIOPopulated = allSteps.length > 0 && allSteps.every((s) => stepIO[s.id] != null);
    if (
      phase !== 'personas' ||
      personas.length === 0 ||
      uniqueApiKeys.length === 0 ||
      stepIOPopulated
    ) {
      return;
    }
    describeCancelRef.current = false;
    setLoadingDescribeForPersonas(true);
    (async () => {
      try {
        const { localDescCache, stepIOUpdate } = await fetchDescriptionsAndStepIO(
          personas,
          idea,
          uniqueApiKeys
        );
        if (!describeCancelRef.current) {
          setDescriptionCache((prev) => ({ ...prev, ...localDescCache }));
          setStepIO((prev) => ({ ...prev, ...stepIOUpdate }));
        }
      } catch {
        // Ignore: user can still open popup and run API Map later to get schemas.
      } finally {
        if (!describeCancelRef.current) {
          setLoadingDescribeForPersonas(false);
        }
      }
    })();
    return () => {
      describeCancelRef.current = true;
      setLoadingDescribeForPersonas(false);
    };
  }, [phase, personas, idea, uniqueApiKeys, stepIO]);

  const handleRegenerateFeatures = useCallback(async () => {
    clearProgressAfter('features');
    if (!idea?.trim()) return;
    setLoadingFeatures(true);
    setErrors((e) => ({ ...e, features: null }));
    try {
      const res = await fetchFeatures(idea);
      setFeatures(res.features || []);
      if (res.idea_summary) setIdeaSummary(res.idea_summary);
    } catch (err) {
      setErrors((e) => ({ ...e, features: appConfig.errors?.features || 'Could not analyse idea' }));
    } finally {
      setLoadingFeatures(false);
    }
  }, [idea, clearProgressAfter]);

  const handleRegeneratePersonaSuggestions = useCallback(async () => {
    clearProgressAfter('persona-suggestion');
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
    } catch (err) {
      setErrors((e) => ({ ...e, personaSuggestions: appConfig.errors?.personaSuggestions || 'Could not suggest personas' }));
    } finally {
      setLoadingPersonaSuggestions(false);
    }
  }, [idea, ideaSummary, features, clearProgressAfter]);

  const handleRegenerateJourneys = useCallback(
    async () => {
      clearProgressAfter('personas');
      const selectedFeatures = features.filter((f) => f.on).map((f) => f.title);
      const confirmed = (confirmedPersonas || []).map((p) => ({
        id: p.id,
        label: p.label,
        icon: p.icon,
        desc: p.desc,
        color: p.color,
        suggested_journeys: p.suggested_journeys || [],
      }));
      if (confirmed.length === 0) return;
      setLoadingJourneys(true);
      setErrors((e) => ({ ...e, journeys: null }));
      try {
        const res = await generateJourneys({ idea, selectedFeatures, confirmedPersonas: confirmed });
        const rawPersonas = res.personas || [];
        const merged = rawPersonas.map((p) => {
          const confirmedP = confirmed.find((c) => c.id === p.id);
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
      } catch (err) {
        setErrors((e) => ({ ...e, journeys: appConfig.errors?.journeys || 'Could not generate journeys' }));
      } finally {
        setLoadingJourneys(false);
      }
    },
    [idea, features, confirmedPersonas, clearProgressAfter]
  );

  const allSteps = personas.flatMap((p) => (p.journeys || []).flatMap((j) => (j.steps || [])));
  const covered = allSteps.filter((s) => {
    const r = apiCatalog[s.id];
    return r && r !== 'loading' && r.match_status !== 'none';
  });
  const coveragePct = allSteps.length ? Math.round((covered.length / allSteps.length) * 100) : 0;
  const missingApiKeys = [
    ...new Set(
      allSteps
        .filter(
          (s) =>
            !apiCatalog[s.id] ||
            apiCatalog[s.id] === 'loading' ||
            apiCatalog[s.id].match_status === 'none'
        )
        .map((s) => s.api)
    ),
  ];
  const missingJiraKeys = [
    ...new Set(
      allSteps
        .filter(
          (s) =>
            apiCatalog[s.id] &&
            apiCatalog[s.id] !== 'loading' &&
            (apiCatalog[s.id].match_status === 'none' || apiCatalog[s.id].build_required)
        )
        .map((s) => s.api)
    ),
  ];
  const totalDays = missingJiraKeys.reduce((a, k) => a + (jiraTickets[k]?.days || 0), 0);

  const openDrawer = (api, enhancements) => {
    setDrawerAPI(api);
    setDrawerEnhancements(enhancements || null);
  };

  const openSuggestionsPopup = (stepId, api, enhancements) => {
    setSuggestionsPopupStepId(stepId);
  };

  const handleStepIOChange = useCallback((stepId, { input, output }) => {
    setStepIO((prev) => ({
      ...prev,
      [stepId]: { input: input ?? prev[stepId]?.input ?? '', output: output ?? prev[stepId]?.output ?? '' },
    }));
  }, []);

  const handleRematchStep = useCallback(
    async (stepId) => {
      const step = allSteps.find((s) => s.id === stepId);
      if (!step) return;
      const desc = descriptionCache[step.api] || {};
      const io = stepIO[stepId] || {};
      const persona = (personas || []).find((p) =>
        (p.journeys || []).some((j) => (j.steps || []).some((s) => s.id === stepId))
      );
      const journey = (personas || [])
        .flatMap((p) => p.journeys || [])
        .find((j) => (j.steps || []).some((s) => s.id === stepId));
      setApiCatalog((c) => ({ ...c, [stepId]: 'loading' }));
      try {
        const result = await ragLookup({
          query_key: stepId,
          description: desc.description,
          context: {
            product_idea: idea,
            persona: persona?.label ?? '',
            journey: journey?.title ?? '',
            step_label: step.label,
          },
          expected_io: { input_schema: io.input ?? '', output_schema: io.output ?? '' },
        });
        setApiCatalog((c) => ({
          ...c,
          [stepId]: {
            ...result,
            _query: {
              description: desc.description,
              context: { product_idea: idea, persona: persona?.label, journey: journey?.title, step_label: step.label },
              expected_io: { input_schema: io.input, output_schema: io.output },
            },
          },
        }));
      } catch (err) {
        setApiCatalog((c) => ({
          ...c,
          [stepId]: {
            query_key: stepId,
            match_status: 'none',
            build_required: true,
            suggested_apis: [],
            _query: {},
          },
        }));
      }
    },
    [idea, personas, descriptionCache, stepIO, allSteps]
  );

  const handleRerank = useCallback(async (stepId, additionalInfo) => {
    const entry = apiCatalogRef.current[stepId];
    if (!entry || typeof entry !== 'object' || !entry._query) return;
    const { description, context, expected_io } = entry._query;
    const suggested_apis = entry.suggested_apis || [];
    if (suggested_apis.length === 0) return;
    setLoadingRerank(true);
    try {
      const res = await ragRerank({
        query_key: stepId,
        description,
        context,
        expected_io,
        additional_info: additionalInfo,
        suggested_apis,
      });
      const newList = res.suggested_apis || [];
      const newFirst = newList[0]?.api || null;
      setApiCatalog((c) => ({
        ...c,
        [stepId]: {
          ...(c[stepId] || {}),
          suggested_apis: newList,
          matched_api: newFirst,
          confidence_score: newList[0]?.score ?? (c[stepId]?.confidence_score ?? 0),
          _query: (c[stepId] || entry)._query,
        },
      }));
    } finally {
      setLoadingRerank(false);
    }
  }, []);

  const handleSelectApi = useCallback((stepId, api) => {
    const entry = apiCatalogRef.current[stepId];
    if (!entry || typeof entry !== 'object') return;
    const single = [{ api, score: entry.confidence_score ?? 1 }];
    setApiCatalog((c) => ({
      ...c,
      [stepId]: {
        ...(c[stepId] || entry),
        matched_api: api,
        suggested_apis: single,
        _query: (c[stepId] || entry)._query,
      },
    }));
    setSuggestionsPopupStepId(null);
  }, []);

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
            {appConfig.header?.appName || 'API Atlas'}
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
              onClick={() => clearProgressAfter('idea')}
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
        {phase !== 'idea' && (
          <Steps
            phase={phase}
            maxReachedPhase={maxReachedPhase}
            onStepClick={phase === 'scanning' ? undefined : (p) => setPhase(p)}
          />
        )}

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
            onRegenerateFeatures={handleRegenerateFeatures}
            loadingRegenerate={loadingFeatures}
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
            onRetry={() => { clearError('journeys'); handleRegeneratePersonaSuggestions(); }}
            onRegenerateSuggestions={handleRegeneratePersonaSuggestions}
            loadingRegenerate={loadingPersonaSuggestions}
          />
        )}

        {phase === 'personas' && (
          <PersonasScreen
            personas={personas}
            onReview={() => setPhase('review')}
            onBack={() => setPhase('persona-suggestion')}
            onRegenerateJourneys={handleRegenerateJourneys}
            loadingRegenerate={loadingJourneys}
            apiCatalog={apiCatalog}
            stepIO={stepIO}
            onStepIOChange={handleStepIOChange}
            onRematchStep={handleRematchStep}
            onGoToApiMap={() => setPhase('review')}
            loadingDescribeForPersonas={loadingDescribeForPersonas}
          />
        )}

        {phase === 'review' && (
          <ReviewScreen
            idea={idea}
            features={features}
            personas={personas}
            onScan={handleScan}
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
            stepIO={stepIO}
            onStepIOChange={handleStepIOChange}
            onRematchStep={handleRematchStep}
            coveragePct={coveragePct}
            coveredCount={covered.length}
            allStepsCount={allSteps.length}
            missingApiKeys={missingApiKeys}
            missingJiraKeys={missingJiraKeys}
            totalDays={totalDays}
            onViewJira={() => setPhase('jira')}
            onOpenDrawer={openDrawer}
            onOpenSuggestionsPopup={openSuggestionsPopup}
            onScrollToJira={() => setPhase('jira')}
            onRescan={handleScan}
            onBackToJourneys={() => setPhase('personas')}
          />
        )}

        {phase === 'jira' && (
          <JiraScreen
            jiraTickets={jiraTickets}
            missingApiKeys={missingJiraKeys}
            onBackToDiagram={() => setPhase('diagram')}
            onPushToJira={() => {}}
            onRescan={handleScan}
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
      {suggestionsPopupStepId && (() => {
        const entry = apiCatalog[suggestionsPopupStepId];
        const raw = entry && typeof entry === 'object' ? (entry.suggested_apis || []) : [];
        const suggestedApis =
          raw.length > 0
            ? raw
            : entry?.matched_api
              ? [{ api: entry.matched_api, score: entry.confidence_score ?? 0 }]
              : [];
        const enhancements = entry && typeof entry === 'object' ? (entry.enhancements || []) : [];
        const step = allSteps.find((s) => s.id === suggestionsPopupStepId);
        const stepLabel = step?.label ?? suggestionsPopupStepId;
        return (
          <APISuggestionsPopup
            stepId={suggestionsPopupStepId}
            stepLabel={stepLabel}
            suggestedApis={suggestedApis}
            enhancements={enhancements}
            onClose={() => setSuggestionsPopupStepId(null)}
            onRerank={handleRerank}
            onSelectApi={handleSelectApi}
            loadingRerank={loadingRerank}
          />
        );
      })()}
    </div>
  );
}
