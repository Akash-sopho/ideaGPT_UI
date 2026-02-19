# IdeaGPT — RAG-Powered API Coverage Engine
## Business Requirements Document · v2.0

| | |
|---|---|
| **Version** | 2.0 — OpenAI + FastAPI Edition |
| **Date** | February 2026 |
| **Status** | Draft — For Review · CONFIDENTIAL |
| **Supersedes** | BRD v1.0 (Anthropic Claude / monolithic calls) |
| **Owner** | Product Engineering Team |

> ⚠️ **What Changed in v2.0**
> All LLM providers switched from Anthropic Claude to OpenAI (GPT-4o). All LLM calls are now independently hosted FastAPI microservices with defined input/output schemas. Personas are no longer hardcoded — a dedicated LLM call suggests them based on the product idea and features, with user confirmation before journey generation. Authentication uses `OPENAI_API_KEY` only.

---

## Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [FastAPI LLM Service Architecture](#3-fastapi-llm-service-architecture)
4. [LLM Endpoint Specifications](#4-llm-endpoint-specifications)
5. [RAG Pipeline Integration](#5-rag-pipeline-integration)
6. [Frontend State Management](#6-frontend-state-management)
7. [Configuration and Secrets](#7-configuration-and-secrets)
8. [UI Changes Required](#8-ui-changes-required)
9. [Demo Use Cases](#9-demo-use-cases)
10. [Acceptance Criteria](#10-acceptance-criteria)
11. [Implementation Sprint Plan](#11-implementation-sprint-plan)
12. [Cost Model](#12-cost-model)
13. [Risks and Mitigations](#13-risks-and-mitigations)

---

## 1. Executive Summary

IdeaGPT is an enterprise product discovery tool that transforms a plain-language product idea into a fully scoped API coverage report in under two minutes. A user describes what they want to build; the system uses OpenAI's GPT-4o models to extract features, suggest and confirm user personas, generate journey maps, and then runs each journey step against a live API catalog via a RAG pipeline to determine which backend capabilities already exist and which must be built.

Version 2.0 updates the original specification with three major architectural changes: (1) all LLM calls now use OpenAI APIs exclusively, authenticated with `OPENAI_API_KEY`; (2) every LLM call is a separately deployed FastAPI microservice with a strictly typed input/output schema; and (3) personas are now generated and suggested by the LLM from the idea and features, presented to the user for selection and editing before journey maps are created.

> 🎯 **North Star Objective**
> A product manager or architect should be able to type any product idea into IdeaGPT and receive, within 60 seconds, an accurate coverage report against their live enterprise API catalog — with auto-generated Jira stories for every gap. No data is hardcoded; every output is live AI inference.

### 1.1 What Is Not Changing

The React frontend UI, the phase state machine, the RAG pipeline contract, the FlowDiagram and Drawer components, the Jira integration, and the API catalog ingestion requirements are all unchanged from v1.0.

### 1.2 Integration Scope

| # | Integration Point | What It Does | Replaces | Change |
|---|---|---|---|---|
| 1 | **Feature Extraction** | GPT-4o infers product features from free-text idea | `FEATURES_MOCK` array | Provider: OpenAI |
| 2a | **Persona Suggestion** | GPT-4o suggests 2–5 relevant personas based on idea + features. User selects/edits before confirming. | `PERSONAS` hardcoded constant | ✨ **NEW in v2.0** |
| 2b | **Journey Generation** | GPT-4o generates journey steps for confirmed personas | `PERSONAS` journeys array | Provider: OpenAI |
| 3 | **RAG API Lookup** | RAG pipeline matches journey steps to live catalog | `APIS` hardcoded object | Unchanged |
| 4 | **Jira Story Generation** | GPT-4o writes tickets for every RAG gap | `JIRA` hardcoded object | Provider: OpenAI |
| 5 | **API Catalog Ingestion** | Pipeline to embed and index OpenAPI/Swagger specs | Static `APIS` object | Unchanged |

---

## 2. System Architecture

### 2.1 High-Level Data Flow

```
USER INPUT
    │
    ▼
FastAPI: /llm/features  →  GPT-4o Feature Extraction
    │
    ▼
FastAPI: /llm/suggest-personas  →  GPT-4o Persona Suggestion  →  USER CONFIRMS
    │
    ▼
FastAPI: /llm/generate-journeys  →  GPT-4o Journey Generation
    │
    ▼
FastAPI: /llm/describe  →  Pre-RAG Descriptions  →  RAG Pipeline: Vector Search  →  API Match
    │
    ▼
Coverage Map  +  FastAPI: /llm/jira (concurrent per gap)  →  OUTPUT
```

### 2.2 Component Breakdown

| Component | Technology | Responsibility | Owner |
|---|---|---|---|
| **IdeaGPT Frontend** | React (JSX) | UI, state machine, API orchestration | Frontend Team |
| **LLM FastAPI Service** | Python FastAPI + OpenAI SDK | 5 independent endpoints, each calling GPT-4o | Platform Team |
| **OpenAI Gateway** | OpenAI API (GPT-4o) | Feature extraction, persona suggestion, journey gen, Jira gen | Platform Team |
| **RAG Lookup Service** | Your RAG Pipeline | Embed query → vector search → return match + enhancements | API Platform Team |
| **Vector Store** | Pinecone / pgvector | Indexed API catalog embeddings | Data Infra |
| **Catalog Ingestion Pipeline** | Python / Node | Parse OpenAPI specs → embed → upsert to vector store | API Platform Team |
| **Jira Integration (optional)** | Jira REST API v3 | Create real tickets from generated stories | DevOps / Platform |

---

## 3. FastAPI LLM Service Architecture

All LLM calls are hosted as independent FastAPI endpoints within a single Python service. Each endpoint has its own strictly typed Pydantic request and response models, making them individually testable, mockable, and deployable. All endpoints share a common `OPENAI_API_KEY` from the environment.

> 💡 **Key Architecture Principle**
> Each FastAPI endpoint is a pure function: it receives a typed request body, calls OpenAI with a fixed prompt template, parses the JSON response, validates it against the response schema, and returns a typed response. No endpoint shares state with another. All prompts live in the service layer, never in the frontend.

### 3.1 Service Overview

| Endpoint | Method | Model | Purpose | Trigger (Frontend) |
|---|---|---|---|---|
| `/llm/features` | POST | gpt-4o | Extract features from idea | Analyse Idea → |
| `/llm/suggest-personas` | POST | gpt-4o | Suggest personas from features | Map Journeys → |
| `/llm/generate-journeys` | POST | gpt-4o | Generate journey steps for confirmed personas | Confirm Personas → |
| `/llm/describe` | POST | gpt-4o-mini | Pre-RAG semantic description per api key | Run Scan (batch) |
| `/llm/jira` | POST | gpt-4o | Generate Jira story for missing API | Post-scan (concurrent) |

### 3.2 Common Configuration

```bash
# Environment Variables (service-wide)
OPENAI_API_KEY=sk-...           # Required. Never in frontend bundle.
OPENAI_ORG_ID=org-...           # Optional. OpenAI org ID.
LLM_DEFAULT_MODEL=gpt-4o        # Default model for all calls.
LLM_FAST_MODEL=gpt-4o-mini      # Used for high-volume cheap calls (/llm/describe).
LLM_REQUEST_TIMEOUT=30          # Seconds before timeout per call.
LLM_MAX_RETRIES=2               # Retry count on JSON parse failure.
```

```python
# main.py
from fastapi import FastAPI
import openai, os

app = FastAPI(title="IdeaGPT LLM Service", version="2.0.0")
openai.api_key = os.getenv("OPENAI_API_KEY")

# Each router imported from its own module
app.include_router(features_router,  prefix="/llm")
app.include_router(personas_router,  prefix="/llm")
app.include_router(journeys_router,  prefix="/llm")
app.include_router(describe_router,  prefix="/llm")
app.include_router(jira_router,      prefix="/llm")
```

---

## 4. LLM Endpoint Specifications

### 4.1 POST /llm/features

| Parameter | Value |
|---|---|
| Model | `gpt-4o` |
| Temperature | `0` (deterministic JSON output) |
| Max Tokens | `2000` |
| Response Format | `{ "type": "json_object" }` — enforced via OpenAI response_format param |
| Trigger | Frontend calls when user clicks "Analyse Idea →" |

#### Request Schema

```python
class FeaturesRequest(BaseModel):
    idea: str                    # User's raw product idea text. Min 10 chars.
    max_features: int = 12       # Max features to extract. Default 12.
    min_features: int = 8        # Min features to extract. Default 8.
```

#### Response Schema

```python
class Feature(BaseModel):
    id: str                      # Sequential: 'f1', 'f2', ...
    icon: str                    # Single emoji character.
    title: str                   # 4-6 word feature name.
    desc: str                    # Max 12 word description.
    on: bool = True              # Default selected. User can toggle.

class FeaturesResponse(BaseModel):
    features: List[Feature]      # 8-12 items.
    idea_summary: str            # 1 sentence LLM summary of the idea.
    model_used: str              # Echoed back: 'gpt-4o'.
```

#### System Prompt

```
You are a product analyst specialising in enterprise software.
You decompose product ideas into discrete, buildable features.
Always respond with valid JSON only.
No markdown, no explanation, no code fences.
The root key must be 'features' (array) and 'idea_summary' (string).
```

#### User Prompt Template

```
Given this product idea, extract {{min_features}}-{{max_features}} features.

Idea: "{{idea}}"

Return JSON with keys: 'features' (array) and 'idea_summary' (string).
Each feature object: { id, icon, title, desc, on: true }
- id: 'f1', 'f2', ... (sequential)
- icon: single relevant emoji
- title: 4-6 word feature name
- desc: max 12 word description
- on: true

idea_summary: one sentence describing what this product does.
```

#### Validation & Error Handling

- Parse `response.choices[0].message.content` as JSON.
- Assert `len(features)` is between `min_features` and `max_features`. If not, retry once with stricter prompt.
- Assert each feature has all 5 fields. Patch missing fields with safe defaults rather than failing.
- On second parse failure: raise `HTTP 422` with `error_code: FEATURE_PARSE_FAILED`.

---

### 4.2 POST /llm/suggest-personas ✨ NEW

> ℹ️ **What Changed from v1.0**
> In v1.0, personas were a hardcoded constant (`guest`, `member`, `admin`). In v2.0, this endpoint generates a set of suggested personas tailored to the specific product idea and its features. The frontend presents these suggestions to the user, who can edit persona names/descriptions and select which ones to include before journey generation begins.

| Parameter | Value |
|---|---|
| Model | `gpt-4o` |
| Temperature | `0.1` (slight variation to generate diverse personas) |
| Max Tokens | `1500` |
| Response Format | `{ "type": "json_object" }` |
| Trigger | Frontend calls after user clicks "Map User Journeys →" |
| Frontend Behaviour | Show persona suggestion cards. User can: rename, edit desc, change icon, select/deselect. On confirm, selected personas pass to `/llm/generate-journeys`. |

#### Request Schema

```python
class SuggestPersonasRequest(BaseModel):
    idea: str                       # The original product idea.
    idea_summary: str               # From FeaturesResponse.idea_summary.
    selected_features: List[str]    # Titles of features where on=True.
    max_personas: int = 4           # How many personas to suggest.
    min_personas: int = 2           # Minimum personas to suggest.
```

#### Response Schema

```python
class PersonaSuggestion(BaseModel):
    id: str                         # snake_case unique id. e.g. 'guest_shopper'
    label: str                      # Display name. e.g. 'Guest Shopper'
    icon: str                       # Single emoji.
    desc: str                       # One sentence describing this persona.
    color: Literal['blue', 'green', 'purple', 'amber']
    rationale: str                  # Why this persona is relevant to the idea.
    suggested_journeys: List[str]   # 2-3 journey names as hints for user.
    is_primary: bool                # True if this is a core/critical persona.

class SuggestPersonasResponse(BaseModel):
    personas: List[PersonaSuggestion]
    model_used: str
```

#### System Prompt

```
You are a UX strategist with expertise in enterprise product design.
Given a product idea and its features, suggest the most relevant user personas.
Each persona must be meaningfully distinct in their goals and workflows.
Always respond with valid JSON only. Root key must be 'personas' (array).
```

#### User Prompt Template

```
Product idea: "{{idea}}"
Summary: "{{idea_summary}}"
Confirmed features: {{selected_features | join(', ')}}

Suggest {{min_personas}}-{{max_personas}} distinct user personas for this product.

For each persona return:
  id: snake_case (e.g. 'clinic_admin')
  label: 2-4 word display name
  icon: single emoji representing the persona
  desc: one sentence description of who this person is
  color: one of ['blue', 'green', 'purple', 'amber']
  rationale: why this persona is critical to this specific product
  suggested_journeys: 2-3 short journey names they would take
  is_primary: true if this persona is central to the product's success

Ensure personas cover both end-users and any operator/admin roles if relevant.
JSON only. Root key: 'personas'.
```

#### Frontend Confirmation Flow

After receiving suggestions, the frontend renders an editable persona selection screen. Supported interactions before proceeding:

- **Select / deselect** personas (minimum 1 must remain selected)
- **Edit** the `label` and `desc` fields inline
- **Change** the icon via an emoji picker
- **Reorder** personas via drag-and-drop
- **Add** a custom persona manually (pre-fills with blank fields)

Only confirmed personas are passed to `/llm/generate-journeys`, replacing what was previously the hardcoded `PERSONAS` constant.

---

### 4.3 POST /llm/generate-journeys

| Parameter | Value |
|---|---|
| Model | `gpt-4o` |
| Temperature | `0` |
| Max Tokens | `4000` |
| Response Format | `{ "type": "json_object" }` |
| Trigger | After user confirms selected personas |
| Note | Receives confirmed persona list including any user edits. Generates all journeys in a single call. |

#### Request Schema

```python
class ConfirmedPersona(BaseModel):
    id: str                         # From PersonaSuggestion (possibly user-edited).
    label: str                      # Possibly user-edited.
    icon: str                       # Possibly user-edited.
    desc: str                       # Possibly user-edited.
    color: str
    suggested_journeys: List[str]   # From LLM suggestion (hints for journey gen).

class GenerateJourneysRequest(BaseModel):
    idea: str
    selected_features: List[str]    # Feature titles where on=True.
    confirmed_personas: List[ConfirmedPersona]
    steps_per_journey: int = 5      # Target steps per journey (4-7).
    journeys_per_persona: int = 2   # Target journeys per persona (1-3).
```

#### Response Schema

```python
class JourneyStep(BaseModel):
    id: str                         # Unique. e.g. 'step_guest_browse_1'
    label: str                      # 2-3 word step label.
    icon: str                       # Single emoji.
    api: str                        # snake_case capability key for RAG lookup.
                                    # MUST be a noun, not a verb-phrase.
                                    # e.g. 'auth', 'payment', 'secure_messaging'

class Journey(BaseModel):
    id: str
    title: str                      # 3-5 word journey name.
    steps: List[JourneyStep]        # 4-7 steps.

class PersonaWithJourneys(BaseModel):
    id: str                         # Matches ConfirmedPersona.id.
    journeys: List[Journey]

class GenerateJourneysResponse(BaseModel):
    personas: List[PersonaWithJourneys]
    unique_api_keys: List[str]      # Deduplicated list of all api keys across
                                    # all personas/journeys. Used to batch
                                    # /llm/describe calls.
    model_used: str
```

#### Critical: `api` Key Naming Rules

> ⚠️ **The `api` field drives the entire RAG lookup.** It must be a semantic `snake_case` noun describing a backend capability, not a UI action. If two steps in the same persona both require authentication, both use the same key `auth` — ensuring the RAG call is made exactly once per unique capability.

| Step Label | ❌ Incorrect `api` Key | ✅ Correct `api` Key |
|---|---|---|
| Sign In | `sign_in` | `auth` |
| Pay Now | `pay_now` | `payment` |
| Send Message to Doctor | `send_message_to_doctor` | `secure_messaging` |
| Upload Lab Report | `upload_lab_report` | `lab_results` |
| Book an Appointment | `book_appointment` | `scheduling` |
| Get Credit Score | `get_credit_score` | `credit_scoring` |

---

### 4.4 POST /llm/describe

| Parameter | Value |
|---|---|
| Model | `gpt-4o-mini` (high volume, low cost) |
| Temperature | `0` |
| Max Tokens | `300` per call |
| Response Format | `{ "type": "json_object" }` |
| Concurrency | Called in batches of 10. One call per unique `api` key. Results cached in `descriptionCache` state. |

#### Request Schema

```python
class DescribeRequest(BaseModel):
    api_key: str                    # The snake_case api key from journey step.
    idea: str                       # Product idea for context.
    step_label: str                 # The step label for richer context.
    persona_label: str              # The persona this step belongs to.
    journey_title: str              # The journey this step belongs to.
```

#### Response Schema

```python
class DescribeResponse(BaseModel):
    api_key: str                    # Echoed back for correlation.
    description: str                # 1-2 sentence capability description
                                    # for semantic RAG search.
    input_schema: str               # Brief description of key input fields.
    output_schema: str              # Brief description of key output fields.
```

---

### 4.5 POST /llm/jira

| Parameter | Value |
|---|---|
| Model | `gpt-4o` |
| Temperature | `0.2` (slight variation for richer stories) |
| Max Tokens | `1200` per story |
| Response Format | `{ "type": "json_object" }` |
| Concurrency | All missing `api` keys fired concurrently via `Promise.all()`. Results merged into `jiraTickets` state incrementally. |
| Priority Logic | P0 if step appears in >50% of journeys; P1 if on a primary persona path; P2 otherwise. |

#### Request Schema

```python
class AffectedStep(BaseModel):
    step_label: str
    journey_title: str
    persona_label: str

class JiraRequest(BaseModel):
    api_key: str                    # The missing capability key.
    idea: str                       # Original product idea.
    affected_steps: List[AffectedStep]  # All steps needing this API.
    rag_gap_summary: str            # gap_summary from RAG response (if any).
    rag_enhancements: List[str]     # Enhancement suggestions from RAG.
    suggested_priority: str         # 'P0' | 'P1' | 'P2' (computed by frontend).
```

#### Response Schema

```python
class JiraResponse(BaseModel):
    api_key: str                    # Echoed back for state merging.
    title: str                      # Ticket title.
    epic: str                       # Parent epic name.
    priority: Literal['P0', 'P1', 'P2']
    story: str                      # 'As a [persona], I want to...' format.
    acceptance: List[str]           # 4-5 acceptance criteria.
    sp: int                         # Story points (Fibonacci: 3/5/8/13/21).
    days: int                       # Estimated man-days.
    sprint: str                     # e.g. 'Sprint 1', 'Sprint 2'
    squad: str                      # Owning squad name.
    deps: List[str]                 # API names this ticket depends on.
    model_used: str
```

---

## 5. RAG Pipeline Integration

The RAG pipeline is unchanged from v1.0. It receives a semantic query and context from the `/llm/describe` pre-processing step, searches the embedded API catalog, and returns the best match with enhancement suggestions.

### 5.1 Request Contract (Frontend → RAG Service)

```json
POST /api/rag/lookup

{
  "query_key": "secure_messaging",
  "description": "HIPAA-compliant encrypted messaging between patients and care providers",
  "context": {
    "product_idea": "Healthcare patient portal",
    "persona": "Patient",
    "journey": "Care Journey",
    "step_label": "Message Doctor"
  },
  "expected_io": {
    "input_schema": "{ sender_id, recipient_id, message_body, attachments[] }",
    "output_schema": "{ message_id, status, delivered_at }"
  },
  "top_k": 3
}
```

### 5.2 Response Contract (RAG Service → Frontend)

```json
{
  "query_key": "secure_messaging",
  "match_status": "partial",
  "confidence_score": 0.74,
  "matched_api": {
    "name": "Notification Dispatcher",
    "endpoint": "/notify/v2/send",
    "method": "POST",
    "team": "Engagement",
    "status": "live",
    "sla": "99.9%",
    "latency": "55ms"
  },
  "enhancements": [
    "Add end-to-end encryption layer (AES-256)",
    "Implement HIPAA audit logging on all message events"
  ],
  "gap_summary": "Existing Notification Dispatcher covers delivery mechanics but lacks encryption and HIPAA compliance.",
  "build_required": false
}
```

### 5.3 match_status → UI Behaviour

| Status | Confidence | UI Treatment | build_required |
|---|---|---|---|
| `exact` | ≥0.90 | Solid green node · **LIVE** badge · click opens contract drawer | `false` |
| `partial` | 0.60–0.89 | Amber node · **ENHANCE** badge · enhancements tab in drawer | `false` (flagged) |
| `none` | <0.60 | Red dashed node · **NEEDS BUILD** · triggers `/llm/jira` | `true` |

### 5.4 Catalog Ingestion Requirements

| Input Format | Priority | Notes |
|---|---|---|
| OpenAPI 3.0 YAML/JSON | **P0** | Parse paths, operationId, summary, description, requestBody, responses |
| Swagger 2.0 JSON | **P0** | Normalise to OAS3 first via swagger-parser |
| AsyncAPI 2.0 YAML | **P1** | For event-driven APIs (Kafka, webhooks) |
| GraphQL SDL | **P1** | Parse Query/Mutation types and descriptions |
| Markdown API Docs | **P2** | Use GPT-4o to extract structured metadata from freeform docs |

**Embedding text template per API endpoint:**

```
API Name: {name}
Capability: {summary} {description}
Team: {team}
OperationId: {operationId}
Endpoint: {method} {path}
Input: {requestBody.description} {requestBody.schema summary}
Output: {responses.200.description} {response schema summary}
Tags: {tags joined by comma}
```

---

## 6. Frontend State Management

The v2.0 state shape adds persona suggestion state and separates persona suggestion from journey generation. The phase state machine gains one new state: `persona-suggestion`.

### 6.1 Updated Phase State Machine

| Phase Value | Screen | What Happens |
|---|---|---|
| `idea` | Idea input | User types product idea. No API calls. |
| `features` | Feature scoping | `POST /llm/features` called. `setFeatures(result)`. User toggles. |
| `persona-suggestion` | **Persona suggestion (NEW)** | `POST /llm/suggest-personas` called. `setPersonaSuggestions(result)`. User edits + selects. |
| `personas` | Journey preview | `POST /llm/generate-journeys` called with confirmed personas. `setPersonas(result)`. |
| `review` | Pre-scan review | Summary of features, personas, step count. No API calls. |
| `scanning` | Scan animation | Batch `/llm/describe` + `/api/rag/lookup`. Progress updates real-time. |
| `diagram` | API coverage map | Renders flow diagram. Concurrent `/llm/jira` for gaps. |
| `jira` | Jira plan | Displays generated tickets. Export / push to Jira. |

### 6.2 Complete State Shape

```javascript
// Existing (unchanged)
const [phase, setPhase] = useState('idea');
const [idea, setIdea] = useState('');

// From LLM Call 1 (/llm/features)
const [features, setFeatures] = useState([]);
const [ideaSummary, setIdeaSummary] = useState('');

// NEW v2.0 — Persona suggestion phase
const [personaSuggestions, setPersonaSuggestions] = useState([]);
const [confirmedPersonas, setConfirmedPersonas] = useState([]);

// From LLM Call 2b (/llm/generate-journeys) — replaces hardcoded PERSONAS
const [personas, setPersonas] = useState([]);
const [uniqueApiKeys, setUniqueApiKeys] = useState([]);

// From RAG pipeline — replaces hardcoded APIS
// Shape: { [api_key]: ApiObject | null | 'loading' }
const [apiCatalog, setApiCatalog] = useState({});

// From LLM Call 3 (/llm/jira) — replaces hardcoded JIRA
const [jiraTickets, setJiraTickets] = useState({});

// Loading states
const [loadingFeatures, setLoadingFeatures] = useState(false);
const [loadingPersonaSuggestions, setLoadingPersonaSuggestions] = useState(false);
const [loadingJourneys, setLoadingJourneys] = useState(false);
const [scanProgress, setScanProgress] = useState({ total: 0, done: 0, current: '' });
const [loadingJira, setLoadingJira] = useState(false);

// Error states
const [errors, setErrors] = useState({
  features: null, personaSuggestions: null,
  journeys: null, scan: null, jira: null
});

// Cache: api_key -> { description, input_schema, output_schema }
const [descriptionCache, setDescriptionCache] = useState({});
```

### 6.3 Scan Orchestration (doScan)

The `doScan()` function replaces the fake timer with real concurrent calls:

1. Collect `uniqueApiKeys` from all steps across all confirmed personas (already returned from `/llm/generate-journeys`).
2. For each unique `api` key, call `POST /llm/describe` in batches of 10. Cache in `descriptionCache`.
3. For each unique `api` key, fire `POST /api/rag/lookup` with description + context. Mark each key as `'loading'` in `apiCatalog`.
4. As each RAG response arrives: update `apiCatalog[key]` with result. Increment `scanProgress.done`. Advance loading bar.
5. After all RAG calls resolve: `setPhase('diagram')`.
6. Immediately fire `POST /llm/jira` for all keys where `match_status === 'none'`, concurrently via `Promise.all()`.
7. As each Jira response arrives: merge into `jiraTickets` state incrementally (cards appear one by one).

> ⚡ **Performance Target:** For 20 unique API keys — pre-RAG descriptions ~3s (batched), RAG lookups ~4s (concurrent), Jira generation ~5s (concurrent, non-blocking). Total perceived wait: under 15 seconds.

---

## 7. Configuration and Secrets

> 🔒 **Security Rule:** `OPENAI_API_KEY` must never appear in the React bundle. All calls to `/llm/*` endpoints are proxied through the FastAPI service which injects the key server-side. The frontend only calls your own FastAPI service URL, never the OpenAI API directly.

### 7.1 FastAPI Service Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | **Yes** | OpenAI API key. Server-side only. Injected into all OpenAI SDK calls. |
| `OPENAI_ORG_ID` | Optional | OpenAI organisation ID. |
| `RAG_SERVICE_URL` | **Yes** | Base URL of your RAG lookup service. |
| `RAG_SERVICE_API_KEY` | **Yes** | Auth token for RAG service. Sent as `Authorization: Bearer`. |
| `JIRA_BASE_URL` | Optional | Your Jira instance URL. Required only for Push to Jira. |
| `JIRA_API_TOKEN` | Optional | Jira API token (base64 `email:token`). |
| `JIRA_PROJECT_KEY` | Optional | Jira project key, e.g. `COM`, `PLAT`. |

### 7.2 Frontend Environment Variables

| Variable | Required | Description |
|---|---|---|
| `REACT_APP_LLM_SERVICE_URL` | **Yes** | Base URL of the FastAPI LLM service. e.g. `https://llm.yourco.internal` |
| `REACT_APP_RAG_SERVICE_URL` | **Yes** | Base URL of the RAG lookup service. |

### 7.3 Full Endpoint Map

| Endpoint | Method | Hosted In |
|---|---|---|
| `/llm/features` | POST | FastAPI LLM Service → OpenAI `gpt-4o` |
| `/llm/suggest-personas` | POST | FastAPI LLM Service → OpenAI `gpt-4o` |
| `/llm/generate-journeys` | POST | FastAPI LLM Service → OpenAI `gpt-4o` |
| `/llm/describe` | POST | FastAPI LLM Service → OpenAI `gpt-4o-mini` |
| `/llm/jira` | POST | FastAPI LLM Service → OpenAI `gpt-4o` |
| `/api/rag/lookup` | POST | Your RAG Service (unchanged from v1.0) |
| `/api/jira/create` | POST | FastAPI passthrough → Jira REST API v3 |

---

## 8. UI Changes Required

### 8.1 New Screen: Persona Suggestion

A new screen is inserted between the Features step and the existing Personas screen. It fires `/llm/suggest-personas` and displays editable suggestion cards.

| Element | Behaviour | State Impact |
|---|---|---|
| Persona suggestion card | Shows icon, label, desc, rationale, suggested_journeys, `is_primary` badge. Selected by default. | `setPersonaSuggestions(suggestions)` |
| Select / deselect toggle | Each card has a checkbox. Minimum 1 must remain selected. | Updates `confirmedPersonas` array |
| Inline edit | Click on label or desc to edit in-place. | Updates `confirmedPersonas[i].label` or `.desc` |
| Add custom persona | Button opens blank card. User fills in label, desc, icon. Color auto-assigned. | Appended to `confirmedPersonas` |
| Confirm Personas → | Fires `/llm/generate-journeys` with `confirmedPersonas`. Shows loading state. | `setPersonas(result)` · `setPhase('personas')` |

### 8.2 Progress Bar Stepper Update

The existing `<Steps>` component gains one step:

| # | Step Label | Phase Value |
|---|---|---|
| 1 | Idea | `idea` |
| 2 | Features | `features` |
| **3** | **Personas ← NEW** | **`persona-suggestion`** |
| 4 | Journeys | `personas` |
| 5 | Review | `review` |
| 6 | API Map | `diagram` |
| 7 | Jira Plan | `jira` |

### 8.3 Loading States Per Phase

| Phase | Loading Treatment | Error Treatment |
|---|---|---|
| Idea → Features | Spinner on button. "Analysing idea…" below input. | Toast: "Could not analyse idea". Retry button. |
| Features → Persona suggestion | Skeleton persona cards (3 pulsing grey rectangles). "Suggesting personas…" | Toast with retry. Keep user on features screen. |
| Persona confirm → Journeys | Spinner on Confirm button. "Building journey maps…" | Toast with retry. Do not clear persona selections. |
| Scan | Real progress bar driven by RAG responses. Each completion advances bar. | Partial results shown if ≥60% succeed. Unknown state for failures (amber). |
| Jira generation | Cards appear incrementally as each `/llm/jira` call resolves. | Placeholder card with "Generation failed — retry" link. |

### 8.4 Flow Diagram Node States

| Node State | Border Style | Badge | Click Action |
|---|---|---|---|
| Loading | Dashed grey, pulsing CSS animation | Spinner icon | Disabled |
| Exact match | Solid green | **LIVE** | Open contract drawer |
| Partial match | Solid amber | **ENHANCE** | Open drawer with Enhancements tab |
| No match | Dashed red | **NEEDS BUILD** | Scroll to Jira story |

---

## 9. Demo Use Cases

Since personas are now LLM-generated, each demo will produce personas tailored to the idea — use this as a talking point to highlight live AI generation vs. hardcoded v1.0 data.

### 9.1 E-Commerce Platform

```
A mobile-first e-commerce app with personalised shopping, one-click checkout
and a loyalty rewards programme
```

**Expected LLM-suggested personas:** Guest Shopper, Registered Member, Store Manager, Marketplace Seller.  
**Coverage:** ~78% · **Gaps:** `cart`, `wishlist`, `warehouse_sync`, `procurement`

> *Demo talking point: The Marketplace Seller persona didn't exist in v1.0 — the LLM added it because the idea implies a multi-vendor catalogue.*

### 9.2 Healthcare Patient Portal

```
A patient-facing healthcare portal where patients can book appointments, view
lab results, message their doctor, and manage prescriptions — with a separate
portal for clinic staff to manage schedules and billing
```

**Expected LLM-suggested personas:** Patient, General Practitioner, Clinic Administrator, Insurance Coordinator.  
**Coverage:** ~55% · **Missing P0 gaps:** `secure_messaging` (HIPAA), `lab_results` (HL7/FHIR), `consent_mgmt`, `insurance_verify`

> *Demo talking point: IdeaGPT knew secure messaging in healthcare requires HIPAA compliance and auto-flagged it P0.*

### 9.3 B2B Procurement Portal

```
An internal procurement platform for enterprise buyers to raise purchase orders,
get multi-level approvals, compare supplier quotes, and track delivery against
contracted SLAs
```

**Expected LLM-suggested personas:** Procurement Officer, Finance Approver, Supplier, Supply Chain Manager.  
**Coverage:** ~65% · **Gaps:** `supplier_catalog`, `approval_workflow`, `sla_monitoring`

### 9.4 FinTech Lending Platform

```
A digital lending platform for SMEs where businesses can apply for credit, submit
financial documents, receive automated credit scoring, and manage repayments with
real-time dashboards
```

**Expected LLM-suggested personas:** SME Owner, Credit Analyst, Compliance Officer, Collections Agent.  
**Coverage:** ~55% · **Missing P0 gaps:** `credit_scoring`, `document_ocr`, `kyb_verification`

---

## 10. Acceptance Criteria

### 10.1 Must Have (P0)

1. Feature extraction from any free-text idea calls OpenAI `gpt-4o` via `/llm/features`. No hardcoded features remain.
2. Persona suggestion calls `/llm/suggest-personas` and presents editable cards. User must confirm before journey generation.
3. Journey generation calls `/llm/generate-journeys` with confirmed personas. No hardcoded `PERSONAS` constant remains in source.
4. All `api` keys on journey steps are `snake_case` capability nouns generated by the LLM (not hardcoded).
5. RAG lookup is called for every unique `api` key. No hardcoded `APIS` object remains.
6. Jira stories are generated by `/llm/jira` for all no-match `api` keys. No hardcoded `JIRA` object remains.
7. `OPENAI_API_KEY` is server-side only in FastAPI service. It never appears in the React bundle.
8. Each FastAPI endpoint has a typed Pydantic request and response schema. Returns `HTTP 422` on validation failure.
9. End-to-end flow completes in under 60 seconds for a 20-step journey map.
10. All four demo use cases produce non-zero Jira stories against a representative API catalog.

### 10.2 Should Have (P1)

11. Persona suggestion cards are editable inline (label, desc, icon) before confirmation.
12. User can add a custom persona manually not suggested by the LLM.
13. Partial match nodes show enhancement suggestions in the Enhancements drawer tab.
14. Scan progress bar advances in real-time as individual RAG calls resolve.
15. Jira cards appear incrementally as `/llm/jira` calls resolve.
16. "Push to Jira" creates real tickets via Jira REST API with correct project key, priority, story, and acceptance criteria.
17. Error states handled gracefully: network failure shows retry button without resetting prior phase.

### 10.3 Nice to Have (P2)

18. Persona `rationale` shown on suggestion cards.
19. Confidence score chip visible directly on flow diagram nodes.
20. Export CSV includes enhancement suggestions alongside missing API stories.
21. Session state persisted in `sessionStorage` for demo resume.

---

## 11. Implementation Sprint Plan

| Sprint | Focus | Deliverables | Exit Criteria |
|---|---|---|---|
| **Sprint 1** (Days 1–6) | FastAPI scaffold + Feature Extraction | FastAPI service with `OPENAI_API_KEY` config. `/llm/features` live with Pydantic schema. `FEATURES_MOCK` removed. `/llm/suggest-personas` live. Persona suggestion screen in frontend. | Live features + persona suggestions on any idea |
| **Sprint 2** (Days 7–12) | Journey generation + Persona confirmation flow | `/llm/generate-journeys` live. Persona confirmation screen (select, edit, add custom). `PERSONAS` constant removed. Journey preview screen using live data. | End-to-end to journey preview on any idea |
| **Sprint 3** (Days 13–18) | RAG integration + Scan phase | `/llm/describe` live. RAG lookup integration. Concurrent scan orchestration. Three-state diagram nodes (exact/partial/none). `APIS` constant removed. | Full scan live against real catalog |
| **Sprint 4** (Days 19–24) | Jira generation + Polish | `/llm/jira` live. Incremental card rendering. Enhancements drawer tab. `JIRA` constant removed. Push to Jira. Error handling. All 4 demo use cases tested. | All ACs met. Demo rehearsed. |

> 📋 **Catalog Ingestion (Parallel Track, Sprint 1–2)**
> The API catalog ingestion pipeline is a separate parallel workstream owned by the API Platform Team. Must be complete by end of Sprint 2 so Sprint 3 RAG integration has a populated vector store. Minimum viable catalog: 15+ real API specs indexed.

---

## 12. Cost Model

Estimates based on OpenAI API pricing (GPT-4o: $5/1M input tokens, $15/1M output tokens; GPT-4o-mini: $0.15/1M input, $0.60/1M output). RAG costs depend on your vector database provider.

| Endpoint | Model | Input Tokens | Output Tokens | Calls / Run | Est. Cost / Run |
|---|---|---|---|---|---|
| `/llm/features` | gpt-4o | ~300 | ~500 | 1 | ~$0.009 |
| `/llm/suggest-personas` | gpt-4o | ~600 | ~800 | 1 | ~$0.015 |
| `/llm/generate-journeys` | gpt-4o | ~800 | ~1,500 | 1 | ~$0.026 |
| `/llm/describe` | gpt-4o-mini | ~150 each | ~120 each | ~20 | ~$0.002 |
| `/llm/jira` | gpt-4o | ~500 each | ~600 each | 4–6 | ~$0.016 |
| **Total per full run** | | | | | **~$0.068** |
| 100 runs / month | | | | | ~$6.80 |

> **Note:** GPT-4o costs are approximately 3× higher than v1.0 Anthropic Sonnet estimates. `gpt-4o-mini` is used for `/llm/describe` to keep high-volume batch costs minimal.

---

## 13. Risks and Mitigations

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| R1 | LLM produces invalid JSON, breaking state update | **High** | Use OpenAI `response_format: { type: 'json_object' }` on all calls. Validate against Pydantic schema. Retry once on failure. `HTTP 422` on second failure. |
| R2 | LLM generates poor `api` key names causing low RAG recall | **High** | Include few-shot examples table in `/llm/generate-journeys` prompt. Post-process: normalise to lowercase `snake_case`, strip verb prefixes. Return `unique_api_keys` from endpoint for auditing. |
| R3 | Persona suggestions irrelevant or too generic | **Medium** | Include selected feature titles and `idea_summary` in prompt. Show `rationale` on each card. User can always add custom personas or edit suggestions. |
| R4 | User edits personas in ways that break journey generation | **Medium** | Pass user's edited `label`/`desc` to `/llm/generate-journeys` as `ConfirmedPersona`. Validate that edited fields are non-empty before confirming. |
| R5 | RAG service latency causes slow scan UX | **Medium** | Fire all RAG calls concurrently. 8s timeout per call with amber "Unknown" fallback. Show real progress bar, not a timer. |
| R6 | API catalog vector store sparse or outdated | **Medium** | Ingest pipeline runs on every catalog change. Show `last_ingested_at` in scan header. Allow manual re-ingest from UI. |
| R7 | `OPENAI_API_KEY` accidentally in frontend bundle | **Low** (if followed) | CI check: `grep` bundle for `OPENAI_API_KEY`. Fail build if found. Frontend only calls `REACT_APP_LLM_SERVICE_URL`. |

---

*End of Document — IdeaGPT RAG API Coverage Engine BRD v2.0*
