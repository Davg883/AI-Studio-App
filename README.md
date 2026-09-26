# Studio Operator

**Studio Operator** is an internal operating system for a one-person AI creative agency. It combines autonomous AI pipeline generation with strict, non-negotiable **Human-in-the-Loop** governance and marketplace safety guardrails.

---

## 🛡️ Core Operating Principle & Safety Guardrails

The operator manually pastes client briefs from Upwork, Fiverr, Contra, email, or direct leads.

> **Absolute Safety Policy:**
> The system **never** scrapes a marketplace, submits a proposal, accepts a contract, messages through a third-party marketplace, or delivers work through a marketplace automatically. All third-party marketplace actions require explicit, manual human execution unless an approved integration is added in the future.

### Human-in-the-Loop Governance Checkpoints
1. **Checkpoint 1: Initial Workflow & Budget Ceiling Lock**
   - The agent cannot execute any Higgsfield image, video, camera, or voice model steps until a human operator has reviewed the production plan and locked the maximum production budget.
2. **Checkpoint 2: Rights & IP Clearance**
   - If the brief analysis detects a high-severity rights concern (trademarked logos, soundalike music, likeness issues), execution is halted until the human operator clears or mitigates the risk.
3. **Checkpoint 3: Autonomous Run Inside Spend Limits**
   - After approval, the agent operates autonomously strictly within the approved ceiling. Any budget increase, material workflow change, or parameter shift automatically halts execution until operator sign-off.
4. **Checkpoint 4: Revisions & Incremental Costs**
   - Client feedback notes are recorded with affected deliverables, recommended actions, and expected incremental costs, requiring operator sign-off before re-rendering.
5. **Checkpoint 5: Signed Final Delivery**
   - Final delivery only goes through `POST /api/jobs/[id]/deliver`, which requires an operator signature token and confirmation that every deliverable was verified. The operator must type their own name to sign. There is no unsigned shortcut: the legacy `approve_final_delivery` approval action returns `403`.

---

## 🚀 Key Features

1. **Intake Engine**:
   - Manually ingest brief, budget, deadline, inbound source, and reference assets.
   - Channel fee presets per source (Upwork: 10%, Fiverr: 20%, Contra / Email / Direct Lead: 0%), editable at intake for negotiated fees.
   - Live preview of the channel fee and what you keep before production costs.
   - Duplicate guard: creating an open job with the same title, client and brief returns `409` with a link to the existing job.
   - Sample briefs are offered only in mock mode.

2. **GPT-6 Astra Requirements Analyzer**:
   - Turns unstructured client briefs into structured deliverables, technical dimensions (e.g. 16:9 4K, 9:16 vertical), durations, visual references, exact script copy, brand constraints, open client questions, and missing information.
   - Autonomous decision engine: **Accept**, **Review**, or **Reject** with executive strategic rationale and confidence rating.
   - Operators can review and edit the analysis side by side with the original. Re-analysis is locked once the plan and budget are approved.

3. **Higgsfield Multi-Model Production Planner**:
   - The workflow builder (`ModelRouter`) picks models by production role from the 22-model capability catalogue in `src/lib/models/capability-catalog.ts` (browsable in the app via **Capability Catalog**):

     | Role | Purpose | Models |
     |---|---|---|
     | **SEARCH** | Cheap, fast concept exploration | Flux 1.1 Schnell, Wan 2.1 Fast / Lite, ByteDance Seedance 2.5 Fast, PixVerse V3 Fast Lane, LTX Video High-Speed Animatics |
     | **CONTROL** | Product / identity keyframes, camera moves, repairs | ByteDance Seedream 2.0, Marketing Studio Image, Qwen Image Edit / Inpaint Pro, Ideogram 2.5, Recraft V3, Higgsfield DoP 2.5 (Director of Photography) |
     | **SHIP** | Final client-facing synthesis | ByteDance Seedance 2.5 Master, Kling 1.5 Pro, Google Veo 2, Higgsfield Soul 2.0 HD, MiniMax Video 01 (Hailuo), Wan 2.1 Native Audio-Video |
     | **FINISH** | Voice, upscaling, captions | ElevenLabs Voice Studio Ultra\*, Higgsfield Speak / Lip-Sync Pro, Topaz Video AI Pro\*, ByteDance Neural Super-Resolution 4K, SubCaption Studio AI\* |

     \* Partner tools; all others are accessed through Higgsfield.
   - A typical chain: SEARCH concepts (8 variants → operator picks 2) → CONTROL keyframes → CONTROL DoP camera pass (video jobs) → SHIP master → CONTROL repair fallback → FINISH voiceover (if needed) → FINISH upscale → FINISH captions & safe-zone cutdowns (vertical deliverables). Each step lists alternatives the operator can swap in.

4. **Profitability & Unit Economics Panel**:
   - Margin cascade: Client Contract Price, Higgsfield GPU Spend, Iteration Contingency Buffer (default 15%), Marketplace Channel Fee, Operator Labour, and Expected Gross Margin (% and $).
   - One server-side calculation (`CostCalculator`) feeds every margin figure in the app, so the job summary, plan and profitability panel always agree.

5. **Operations Dashboard**:
   - **Needs you now**: the most urgent jobs waiting on the operator, with deadlines.
   - **Human Checkpoints** card doubles as a filter for jobs waiting on you.
   - Pipeline Kanban grouped into 7 stages; cards show what each job is waiting on (e.g. *Needs analysis*, *Budget lock*, *Rights clearance*, *Final sign-off*), the locked spend cap, and a deadline coloured by urgency.
   - Cards are sorted waiting-on-you first, then by deadline. Empty, Delivered and Rejected columns fold into slim strips so the whole pipeline fits on screen.
   - Pipeline stages:
     - `New`: Fresh intake awaiting analysis.
     - `Needs Review`: Analysis complete / rights issue flagged / awaiting operator approval.
     - `Approved`: Production plan and budget ceiling locked.
     - `Generating`: Autonomous model execution inside authorized limits.
     - `QA`: All renders completed; operator quality check.
     - `Delivered`: Operator-signed final handoff.
     - `Rejected`: Scope/budget mismatch.

6. **Job Workspace**:
   - A summary strip shows the current stage, the next action, the active blocker, the remaining spend against the cap, and the expected margin.
   - The **next action is a button** that jumps to where it is carried out, and the page opens on that stage.
   - A single six-stage navigation (**Brief → Plan → Authorise → Produce → Review → Deliver**) marks stages as done, current or upcoming and hosts every view:

     | Stage | Views |
     |---|---|
     | Brief | Brief & open questions · Astra decision · Review analysis |
     | Plan | Workflow · Costs & margins |
     | Authorise | Approval checkpoints · Client messages |
     | Produce | Rendered outputs |
     | Review | Revisions · QA repairs · Feedback interpreter |
     | Deliver | Verified deliverables · Signed sign-off |

7. **Interactive Media Outputs & Revision Log**:
   - Integrated HTML5 video players, high-res image viewers, and voiceover audio players.
   - Provider request IDs (`hg_req_...`), render latencies, and actual incurred costs.
   - Inbound revision tracking with incremental budget approval.

8. **Studio Menu**:
   - Operator name (recorded on every approval and sign-off), autonomy policy, audit ledger, and Higgsfield connection test.
   - Resetting to seed data sits in a separate *Demo data* section behind a confirmation dialog.
   - The header shows whether generation is running in **Mock mode** or **Live mode** (live generations incur real spend).

9. **Feedback, Loading & Accessibility**:
   - Success and error toasts for every action; skeleton loading states; clear *Job not found* / *Try again* screens.
   - No manual refresh needed: the dashboard refetches on focus, and both pages poll while a job is generating.
   - Minimum 12px text, monospace reserved for data, higher-contrast secondary text.
   - Focus-trapped dialogs (Escape to close, focus restored), labelled form controls, and arrow-key navigation for stage and view tabs.

---

## 📦 Tech Stack & Architecture

- **Framework**: Next.js 14 (App Router, React 18, TypeScript)
- **Styling**: Tailwind CSS with dark operational aesthetic
- **Icons**: Lucide React
- **Persistence Layer**: Decoupled Repository Pattern (`IJobRepository`) backed by a JSON document store (`.data/studio_store.json`), allowing seamless migration to PostgreSQL without touching application business logic.
- **Job State**: `src/lib/job-state.ts` is the single source of truth for where a job is in the pipeline (stage, next action, blocker, what it is waiting on). Every panel and card reads from it instead of re-deriving state.
- **Mock Mode**: Fully operational with zero API keys. Generation is simulated when `MOCK_MODE=true` **or** Higgsfield credentials are missing; brief analysis is simulated when `MOCK_MODE=true` or `OPENAI_API_KEY` is missing. `GET /api/config` reports the active mode to the UI.

### Key Files

| Path | Purpose |
|---|---|
| `src/lib/job-state.ts` | Derived job state: stages, next action, blockers, deadlines |
| `src/lib/services/cost-calculator.ts` | Single margin calculation (incl. operator labour) |
| `src/lib/operator.ts` | Operator identity (env default + per-browser override) |
| `src/components/job-detail/WorkflowStageWorkspace.tsx` | Job summary strip, stage navigation, signed delivery |
| `src/components/dashboard/PipelineView.tsx` | Kanban board with urgency and collapsible columns |
| `src/components/ui/toast.tsx` | Toast notifications |
| `src/app/api/jobs/[id]/deliver/route.ts` | Server-enforced signed final delivery |

---

## 🛠️ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Default configuration enables Mock Mode:
```env
MOCK_MODE=true
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_OPERATOR_NAME=
DEFAULT_CHANNEL_FEE_PCT=10
DEFAULT_CONTINGENCY_PCT=15
```

- `NEXT_PUBLIC_OPERATOR_NAME` sets the default name recorded on approvals (falls back to *Studio Operator*). Each browser can override it from the **Studio** menu.
- To run live, set `MOCK_MODE=false` and add the Higgsfield / OpenAI keys. The header switches to **Live mode**.

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run End-to-End Verification Test
```bash
node test-e2e.mjs
```
The test creates a uniquely named job and deletes it when it finishes. To test a server on another port, set `BASE_URL`:
```bash
BASE_URL=http://localhost:3001 node test-e2e.mjs
```

---

## 🎬 Pre-loaded Seed Demonstrations

1. **Aethelgard: The Obsidian Horizon Concept Film** (Upwork, $4,200)
   - Status: `QA`
   - High-concept Scandinavian luxury perfume teaser with complete 5-step workflow, rendered video/audio outputs, and approved revision note.
2. **CrispVolt: 15s Kinetic Electrolyte Energy Loop** (Contra, $950)
   - Status: `Needs Review`
   - Fast social spot demonstrating rights review flags for soundalike music.
3. **Apex Kinetic: Zero-G Running Shoe Teaser** (Direct Lead, $2,800)
   - Status: `New`
   - Inbound lead ready for instant 1-click GPT-6 Astra analysis and workflow creation.

Additional demos can be loaded into `.data/studio_store.json` with the Python seed scripts:

- `seed_autonomous_agency_demo.py` / `seed_demo_workflows.py`: *After the Rain* and *Night Orchard*, with client memory and messages
- `populate_live_proposals.py`: *Appley Café (Chef-Led Pilot)*, *Appley Manor* and *The Garlic Farm* trail proposals

> **Studio ▾ → Reset to seed data** replaces the whole store with only the three built-in demos above. Script-loaded demos, client memory and audit history are removed.
