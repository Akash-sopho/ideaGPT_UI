# IdeaGPT — UI

React frontend for IdeaGPT (RAG-powered API coverage engine). See [BRD.md](./BRD.md) for product and API contracts.

## Scope

- **UI only:** All screens, state machine, and API client calls to external LLM and RAG services.
- **No backend in this repo:** Backend (FastAPI LLM service, RAG pipeline, Jira) is built and run elsewhere. This app reads base URLs from config.

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   Copy [.env.example](.env.example) to `.env` and set:

   - `VITE_LLM_SERVICE_URL` — Base URL of the FastAPI LLM service (e.g. `http://localhost:8000`).
   - `VITE_RAG_SERVICE_URL` — Base URL of the RAG lookup service. For local development, when the same backend serves both LLM and RAG endpoints, use the same URL (e.g. `http://localhost:8000`). In production, set both to your deployed backend base URL (or separate URLs if LLM and RAG are split).

   No API keys are used in the frontend; the LLM service holds `OPENAI_API_KEY` server-side.

3. **Run**

   ```bash
   npm run dev
   ```

   Build for production: `npm run build`. Preview build: `npm run preview`.

## Config

All copy, limits, and options are config-driven (no hardcoded data in components):

- `src/config/env.js` — Reads `VITE_*` / `REACT_APP_*` base URLs.
- `src/config/app.config.js` — Step labels, limits (features, personas, journey steps), screen copy, example ideas.
- `src/config/theme.config.js` — Design tokens (colors, fonts).
- `src/config/scan.config.js` — Loading messages, batch size, RAG `top_k`.
- `src/config/api.config.js` — API path constants.

## Structure

- `src/config/` — Config modules.
- `src/api/` — API client (LLM and RAG); uses config for URLs and paths.
- `src/components/` — Steps, Chip, Dot, Drawer, FlowDiagram.
- `src/screens/` — One screen per phase: Idea, Features, PersonaSuggestion, Personas, Review, Scanning, Diagram, Jira.
- `src/App.jsx` — Phase state machine, header, and scan orchestration.

## Phases

1. **Idea** — User enters product idea; submits to analyse.
2. **Features** — Features from `/llm/features`; user toggles; "Map User Journeys" calls `/llm/suggest-personas`.
3. **Persona suggestion** — Suggested personas; user selects/edits; "Confirm Personas" calls `/llm/generate-journeys`.
4. **Personas** — Journey preview; "Review & Confirm" → Review.
5. **Review** — Summary; "Run API Coverage Scan" starts scan.
6. **Scanning** — Batch `/llm/describe`, then concurrent `/api/rag/lookup`; progress from real completion.
7. **Diagram** — Coverage %, persona/journey tabs, flow diagram (exact/partial/none); drawer for contract and enhancements.
8. **Jira** — Generated tickets; Copy, Export CSV, Push to Jira (Push calls your backend).

## Design

UI follows the layout and behaviour from `ideagpt.jsx` and BRD Section 8. Design tokens and fonts come from `theme.config.js`; no raw hex or mock data in components.
