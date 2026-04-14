# CLAUDE.md — CreatorFlow

> This file is the single source of truth for the CreatorFlow project. Claude Code should read this file at the start of every session. As phases are completed, this file will be updated to reflect current state and remaining work.

---

## Project Background

CreatorFlow is a public-facing web application that helps users — primarily technical and non-technical product managers, content creators, and marketing teams — design agentic workflows for social media automation. Users describe what they want to automate, and CreatorFlow guides them through a structured experience that produces a visual, interactive workflow diagram and a plain-English summary brief they can share or export.

The product is intentionally approachable. It requires no coding knowledge to use and no account to try. The AI layer is doing real multi-step reasoning under the hood, but the user experience should feel simple, fast, and satisfying.

---

## Core User Experience (Three Phases)

**1. Discover** — User lands on the site, learns what social media automation is, browses example workflows, and finds idea prompts organized by persona. This phase exists to inspire users who don't yet know what they want to build.

**2. Brainstorm** — A conversational chat interface where the user describes their idea. An AI agent asks up to 4 clarifying questions, then summarizes the idea back to the user for confirmation. Max 4 questions — never more. Questions should feel friendly and non-technical.

**3. Build** — Once the idea is confirmed, a multi-agent LangGraph pipeline generates a full workflow. The output is an interactive visual graph (React Flow) showing agents as nodes and handoffs as edges. A plain-English summary brief lives in the sidebar. Users can refine the workflow via follow-up chat, export a PDF, or share a link.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, React Flow, Tailwind CSS, Framer Motion |
| Backend | FastAPI (Python) |
| Orchestration | LangGraph |
| LLM | Claude via Anthropic API (claude-sonnet-4-20250514) |
| Database | Supabase (PostgreSQL) |
| Session State | Redis |
| PDF Export | fpdf2 + Pillow (pure Python, no headless browser) |
| Frontend Hosting | Vercel |
| Backend Hosting | Railway or Render |

---

## LangGraph Pipeline

The backend runs a stateful LangGraph pipeline with the following nodes:

- **Intake Node** — Assesses idea clarity and routes to clarification or classifier
- **Clarification Node** — Generates one question at a time (max 4 rounds) to resolve platform, goal, and automation level
- **Intent Classifier Node** — Maps confirmed idea to one of four archetypes:
  - `trend_to_content` — scan trends → generate content → publish
  - `source_transform_distribute` — ingest media → transform → push to platforms
  - `monitor_engage_report` — watch mentions → respond → summarize
  - `schedule_generate_publish` — calendar-driven content generation
- **Workflow Designer Node** — Generates full workflow as structured JSON (nodes + edges schema that React Flow renders directly)
- **Explainer Node** — Produces plain-English summary brief from workflow JSON
- **Refinement Node** — Handles post-generation follow-up chat, updates workflow JSON, appends to refinement history

### Shared State Object

```python
class CreatorFlowState(TypedDict):
    raw_idea: str
    clarifying_questions: list[str]
    clarifying_answers: list[str]
    question_round: int
    workflow_archetype: str
    target_platforms: list[str]
    automation_level: str        # "full" or "human_in_loop"
    workflow_json: dict
    summary_brief: str
    refinement_history: list[dict]
```

### Workflow JSON Schema (React Flow compatible)

```json
{
  "nodes": [
    {
      "id": "node_1",
      "type": "agent",
      "label": "Trend Scanner",
      "description": "Monitors TikTok weekly trends and identifies the top 5 by engagement",
      "tools": ["TikTok API", "Trend scoring model"],
      "inputs": ["Platform selection", "Time window"],
      "outputs": ["Ranked trend list"]
    }
  ],
  "edges": [
    {
      "from": "node_1",
      "to": "node_2",
      "label": "Passes trend list"
    }
  ],
  "archetype": "trend_to_content",
  "automation_level": "full"
}
```

---

## API Endpoints

### Brainstorm
- `POST /api/brainstorm/start` — Submit initial idea, receive first clarifying question or readiness signal
- `POST /api/brainstorm/respond` — Submit answer to clarifying question, receive next question or confirmation summary

### Workflow
- `POST /api/workflow/generate` — Trigger full pipeline after idea is confirmed
- `POST /api/workflow/refine` — Submit refinement message, receive updated workflow JSON
- `GET /api/workflow/{workflow_id}` — Fetch saved workflow (used by shareable links)
- `POST /api/workflow/{workflow_id}/share` — Generate shareable link token
- `GET /api/workflow/{workflow_id}/export` — Generate and return PDF export

### Content (Discover Phase)
- `GET /api/content/examples` — Returns pre-built example workflows for the gallery
- `GET /api/content/ideas` — Returns idea prompts organized by persona

---

## Database Schema (Supabase / PostgreSQL)

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_idea TEXT NOT NULL,
  clarifying_questions JSONB DEFAULT '[]',
  clarifying_answers JSONB DEFAULT '[]',
  question_round INT DEFAULT 0,
  idea_summary TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id),
  workflow_json JSONB NOT NULL,
  summary_brief TEXT,
  archetype VARCHAR(50),
  platforms TEXT[],
  automation_level VARCHAR(20),
  refinement_history JSONB DEFAULT '[]',
  share_token VARCHAR(20) UNIQUE,
  view_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE examples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(100) NOT NULL,
  description TEXT,
  persona VARCHAR(50),
  archetype VARCHAR(50),
  platforms TEXT[],
  workflow_json JSONB NOT NULL,
  display_order INT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE idea_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona VARCHAR(50),
  prompt_text TEXT NOT NULL,
  archetype VARCHAR(50),
  platforms TEXT[],
  display_order INT
);
```

---

## UX & Design Principles

These must be respected across all phases:

- **No account required** to try the product. Accounts are optional and deferred.
- **Max 4 clarifying questions** in the brainstorm phase. Never exceed this.
- **Plain English everywhere** — no technical jargon in user-facing copy, node descriptions, or the summary brief.
- **Layered disclosure** on the workflow graph — default view shows node names and flow only; clicking a node reveals full detail card.
- **Progress indicators** between phases so users always know where they are.
- **Transition moments** — the Brainstorm → Build transition should include a loading animation ("Designing your workflow…") that builds anticipation.
- **Responsive** — the app must work cleanly on desktop and tablet. Mobile is secondary but should not break.
- **Viral loop** — shared workflow links render a read-only view with a "Build your own" CTA that brings new users into the Discover phase.

---

## Project File Structure (Target)

```
creatorflow/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── discover/        # Hero, ExampleGallery, IdeaFuel, EducationSection
│   │   │   ├── brainstorm/      # ChatInterface, ProgressIndicator, IdeaSummary
│   │   │   ├── workflow/        # WorkflowCanvas, AgentNode, SummaryBrief, RefinementChat
│   │   │   └── shared/          # Navbar, Footer, Button, LoadingState
│   │   ├── pages/
│   │   │   ├── index.jsx        # Discover phase
│   │   │   ├── brainstorm.jsx   # Brainstorm phase
│   │   │   ├── workflow.jsx     # Build phase
│   │   │   └── share/[token].jsx # Shared workflow read-only view
│   │   ├── hooks/               # useSession, useWorkflow, useBrainstorm
│   │   └── lib/                 # api.js, constants.js
│   └── public/
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── routers/
│   │   ├── brainstorm.py
│   │   ├── workflow.py
│   │   └── content.py
│   ├── agents/
│   │   ├── graph.py             # LangGraph pipeline definition
│   │   ├── nodes/
│   │   │   ├── intake.py
│   │   │   ├── clarification.py
│   │   │   ├── classifier.py
│   │   │   ├── designer.py
│   │   │   ├── explainer.py
│   │   │   └── refinement.py
│   │   └── state.py             # CreatorFlowState TypedDict
│   ├── db/
│   │   ├── client.py            # Supabase client
│   │   └── models.py
│   ├── services/
│   │   ├── export.py            # fpdf2 + Pillow PDF generation (no headless browser)
│   │   └── share.py             # Share token generation
│   └── prompts/                 # All LLM prompt templates as .txt or .py files
└── CLAUDE.md
```

---

## Build Phases

> Complete phases in order. Do not begin a phase until the previous one is fully working and tested. After each phase is complete, the human will update this file with the next phase before continuing.

---

### Phase 1 — Project Scaffold & Environment Setup ✅ COMPLETE

**What was built:**
- Vite + React frontend with react-router-dom, tailwindcss, framer-motion, reactflow, axios
- Dark violet brand palette via CSS variables in `index.css`; Tailwind v4 with `@tailwindcss/vite`
- 4 pages + routing: `/`, `/brainstorm`, `/workflow/:workflowId`, `/share/:token`
- `Navbar` component with logo and "Start Building" CTA
- FastAPI backend with `GET /health`, placeholder routers for brainstorm/workflow/content
- `backend/agents/state.py` with full `CreatorFlowState` TypedDict
- `.env` files for both frontend and backend
- **Backend runs on port 8001** (8000 is occupied by another process on this machine)

**Run commands:**
- Frontend: `cd frontend && npm run dev` (port 5173)
- Backend: `cd backend && source venv/Scripts/activate && uvicorn main:app --reload --port 8001`

---
### Phase 2 — Discover Page (Static) ✅ COMPLETE

**What was built:**
- `HeroSection` — animated SVG workflow preview, headline, two CTAs ("Start Building" → `/brainstorm`, "See Examples" → `#examples` anchor)
- `EducationSection` — 4 cards: what an agent is, what automation saves, workflow types, no coding needed
- `ExampleGallery` — 6 hardcoded example cards with mini SVG node diagrams, platform tags, persona tags; click logs to console
- `IdeaFuel` — persona tabs (Solo Creator / Marketing Team / Podcast Brand / Small Business), 3 prompt cards each; "Build this" navigates to `/brainstorm` with `state.prefill`
- `Footer` — logo, tagline, link to brainstorm
- All data hardcoded in `frontend/src/lib/constants.js`
- Framer Motion scroll-triggered animations on all sections (`useInView`)
- `html { scroll-behavior: smooth }` for anchor scrolling
- Page title + meta description set in `index.html`
---

### Phase 3 — Backend Core: LangGraph Pipeline ✅ COMPLETE

**What was built:**
- `backend/agents/state.py` — `CreatorFlowState` TypedDict with routing flags (`needs_clarification`, `ready_to_generate`) added
- `backend/agents/nodes/` — 6 nodes: intake, clarification, classifier, designer (max_tokens: 2000), explainer, refinement
- `backend/agents/graph.py` — LangGraph `StateGraph` with conditional edges: intake routes to clarification or classifier; clarification loops until `ready_to_generate=True` or `question_round >= 4`; classifier → designer → explainer → END
- `backend/prompts/` — 6 prompt files (one per node), well-commented
- `backend/agents/test_pipeline.py` — end-to-end test with pre-loaded answers; all assertions pass (5 nodes, 4 edges, valid summary, loop fired)
- All nodes have 3-retry logic for API 529 overload errors
- `backend/requirements.txt` generated

**Test:** `cd backend && source venv/Scripts/activate && python agents/test_pipeline.py`

---

### Phase 4 — Backend API + Database Integration ✅ COMPLETE

**What was built:**
- `backend/db/client.py` — Supabase singleton client
- `backend/db/models.py` — All DB operations (sessions, workflows, examples, idea_prompts, stats)
- `backend/db/create_tables.sql` — SQL migration (already run in Supabase)
- `backend/services/cache.py` — Redis session state (2hr TTL, keyed by session_id)
- `backend/services/summary.py` — Idea summary generator (Claude call, shown on confirmation card)
- `backend/routers/brainstorm.py` — `POST /start`, `POST /respond` (nodes called directly, not via graph)
- `backend/routers/workflow.py` — `POST /generate`, `POST /refine`, `GET /{id}`, `POST /{id}/share`, `GET /share/{token}`, `GET /{id}/export` (501 placeholder until Phase 7)
- `backend/routers/content.py` — `GET /examples`, `GET /ideas`, `GET /stats` — all auto-seed on first call
- All 11 endpoints tested and passing; full brainstorm → generate → refine → share flow verified against Supabase

**Architecture note:** Brainstorm phase calls nodes directly (not through LangGraph pipeline). `workflow/generate` also calls nodes directly. The compiled `pipeline` in `graph.py` is available but not used in API layer — cleaner for incremental/partial execution.

---

### Phase 5 — Brainstorm Page (Frontend + API Integration) ✅ COMPLETE

**What was built:**
- `brainstorm.jsx` — full chat-style page: user messages right-aligned, bot messages left-aligned with logo avatar, typing indicator, inline error display
- `components/shared/ProgressIndicator.jsx` — 3-step indicator; step prop controls active/done state
- `components/brainstorm/GeneratingOverlay.jsx` — full-screen animated overlay with pulsing node graph and moving dot; shown during `workflow/generate` call
- Confirmation card shown when `ready_to_generate: true`; "Looks good" triggers overlay + `POST /api/workflow/generate` → navigates to `/workflow/{id}`; "Let me adjust" re-opens input
- "Build this" prefill: `IdeaFuel` passes `state.prefill` via router state; `brainstorm.jsx` reads it on mount and auto-submits
- All API calls wired to `lib/api.js` helpers; errors shown inline without breaking chat thread

**Post-phase UI refinements:**
- Brainstorm page uses a **two-column layout** (`max-w-5xl`, `lg:flex-row`) before any session starts: left col (chat + input), right col (compact step cards + cycling workflow preview with "Example workflows" label). Collapses to single centered column (`max-w-2xl`) once conversation begins. On mobile, right col content appears inline above the input bar.
- `StepCards` accepts a `compact` prop — row layout, tighter padding, smaller description text for the right column variant.
- `WorkflowPreviewCycle` — 3 cycling SVG workflow patterns that build up node-by-node and edge-by-edge, cycling every ~3.2s. Sits in both the right column (desktop) and inline above input (mobile).
- Textarea auto-expands as user types (capped at 120px, then scrolls internally).
- Homepage: hero `min-h` reduced to 75vh, `WorkflowPreview` enlarged to `max-w-xl` with stronger dual-layer glow; `EducationSection` padding reduced `py-24 → py-16` to close whitespace gap; `Footer` CTA link replaced with `© 2025 CreatorFlow`.

---

### Phase 6 — Workflow Page (React Flow Visualization) ✅ COMPLETE

**What was built:**
- `workflow.jsx` — full two-panel page (`h-screen overflow-hidden`): left = React Flow canvas + node detail panel, right = summary brief + refinement chat. Uses `location.state.workflowData` from brainstorm navigation to skip a redundant API fetch; falls back to `GET /api/workflow/{id}` otherwise.
- DAG auto-layout: topological column assignment (longest path from root) → nodes positioned horizontally by column, vertically centered per column. Handles linear chains, diamond branches, and fan-out patterns.
- `components/workflow/AgentNode.jsx` — custom React Flow node: colored left border + role badge (Entry / Agent / Output) keyed to graph position (emerald / violet / purple). Shows label + truncated description. Selection ring on click.
- `NodeDetailPanel` — slides up from canvas bottom on node click, shows full description, tools, inputs, outputs in 3-column grid. Closes on X or pane click.
- `SummaryBrief` (inline) — platforms, automation level, archetype tags + plain-English summary.
- `RefinementChat` (inline) — compact chat input, calls `POST /api/workflow/refine`, updates React Flow graph in-place with new `workflow_json`.
- Action bar: "Start over" → `/brainstorm`; "Export PDF" → calls endpoint (501 toast until Phase 7); "Share" → generates token, copies `origin/share/{token}` to clipboard, shows toast.
- `share/token.jsx` — read-only shared view: fetches by token, same React Flow canvas with `nodesDraggable/nodesConnectable/elementsSelectable` all false, "Build your own workflow →" CTA in header and sidebar.
- React Flow dark theme CSS overrides in `index.css` (controls, minimap, background, attribution hidden).
- `api.js` additions: `exportWorkflow`, `getWorkflowByToken`.

**Architecture note:** `NODE_TYPES` object defined outside all components (module-level constant) so React Flow never gets a new reference and avoids re-mounting nodes on re-render.

---

### Phase 7 — PDF Export & Polish ✅ COMPLETE

**What was built:**
- `backend/services/export.py` — pure-Python PDF generator using `fpdf2` (no Chromium/headless browser). Produces a clean one-page brief: dark header band with accent stripe, platform/automation chips, plain-English summary, DAG workflow diagram with colored node boxes (green/violet/purple by role) and arrowed connecting lines. Layout mirrors the frontend topological column algorithm.
- `backend/routers/workflow.py` — `GET /api/workflow/{id}/export` wired to `generate_pdf()`, returns `application/pdf` with `Content-Disposition: attachment`.
- `frontend/workflow.jsx` — Export button now triggers a real browser download via `Blob` + `URL.createObjectURL`.
- `ExampleGallery.jsx` — Cards now open a full modal with an interactive React Flow preview (same `AgentNode` + linear layout), description, platform tags, and a "Build this →" CTA that prefills the brainstorm page.
- `HeroSection.jsx` — Calls `GET /api/content/stats` on mount; displays `"{count} workflows designed and counting"` below CTAs when count > 0.
- `api.js` — Added `getStats`.
- Page titles set via `useEffect` on brainstorm (`Brainstorm · CreatorFlow`), workflow (`Your Workflow · CreatorFlow`), and share (`Shared Workflow · CreatorFlow`) pages.
- `ExampleGallery` section padding reduced to `py-16` to match the rest of the site.

**Note:** `fpdf2` installed in backend venv. Add `fpdf2` to `requirements.txt` before deploying.

**Post-phase cleanup:**
- `backend/services/export.py` — Rewrote diagram rendering using **Pillow (`PIL`) + `ImageDraw`** instead of fpdf2 drawing primitives. Pillow renders a PNG (nodes as rounded-rect cards with colored left-accent bars, arrowhead edges, truncated labels/descriptions using system fonts) then embeds it via `pdf.image()`. `cairosvg` and `svglib` were ruled out — both require Cairo DLL which is not available on Windows without GTK. Also added: **Agent breakdown section** (each agent listed with role-colored dot, bold name, and wrapped description), larger header (52mm, 22pt title), larger summary text (11pt, 6.5mm line height), better section spacing throughout. Auto page break enabled — agent section can overflow to page 2, diagram follows on the first page with sufficient space (≥50mm).
- `components/workflow/AgentNode.jsx` — Added `useState(hovered)`. The **inner visual div** scales to `1.08` on hover or select (150ms CSS transition, elevated box shadow). Root div where handles live does not scale, keeping React Flow edge connections anchored.
- `workflow.jsx` — Canvas extracted into `WorkflowCanvas` component (child of `ReactFlowProvider`) that calls `useReactFlow()`. `useEffect` triggers `fitView({ padding: 0.18, duration: 400 })` after 60ms whenever `rfNodes.length` or `fitTrigger` changes — fires correctly after async data load and after each refinement. `NodeDetailPanel` animation changed to `scaleY` expand from bottom (`initial: scaleY 0.6` → `animate: scaleY 1`, `transformOrigin: bottom`) for an intentional "growing" feel.
- `Pillow` added to backend venv. Add `Pillow` to `requirements.txt` before deploying.

---

## Current Status

**Active Phase:** Complete — all 7 phases shipped.

**Completed Phases:** Phase 1, Phase 2, Phase 3, Phase 4, Phase 5, Phase 6, Phase 7

---

## Notes for Claude Code

- Always read this file at the start of a session before taking any action
- Never skip ahead to a later phase — complete and verify acceptance criteria before moving on
- When in doubt about a design decision not covered here, default to the simpler, more user-friendly option
- All Claude API calls use model `claude-sonnet-4-20250514` and `max_tokens: 1000` unless a specific node requires longer output (designer and explainer nodes may need up to 2000)
- Keep prompts in `backend/prompts/` clean and well-commented — they are part of the portfolio artifact
- Commit frequently with descriptive commit messages
