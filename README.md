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
   - If the brief analysis detects trademarked logos, Hollywood soundalike aesthetics, or likeness issues, execution is halted until the human operator clears or mitigates the risk.
3. **Checkpoint 3: Autonomous Run Inside Spend Limits**
   - After approval, the agent operates autonomously strictly within the approved ceiling. Any budget increase, material workflow change, or parameter shift automatically halts execution until operator sign-off.
4. **Checkpoint 4: Revisions & Incremental Costs**
   - Client feedback notes are recorded with affected deliverables, recommended actions, and expected incremental costs, requiring operator sign-off before re-rendering.
5. **Checkpoint 5: Final Delivery Sign-off**
   - Operator human sign-off is required to transition from QA to Delivered status.

---

## 🚀 Key Features

1. **Intake Engine**:
   - Manually ingest brief, budget, deadline, inbound source, and reference assets.
   - Default channel fee presets (Upwork: 10%, Fiverr: 20%, Contra: 0%, Direct Lead: 0%).

2. **GPT-6 Astra Requirements Analyzer**:
   - Turns unstructured client briefs into structured deliverables, technical dimensions (e.g. 16:9 4K, 9:16 vertical), durations, visual references, exact script copy, brand constraints, and missing information.
   - Autonomous decision engine: **Accept**, **Review**, or **Reject** with executive strategic rationale and confidence rating.

3. **Higgsfield Multi-Model Production Planner**:
   - Automated workflow builder utilizing:
     - **Higgsfield Concept Keyframe Pro**: Photorealistic master base stills.
     - **Higgsfield DoP 2.5 (Director of Photography)**: Precision orbital push-ins, crane shots, and steadicam trajectory.
     - **Higgsfield Cinematic Motion V3**: Generative fluid video scene synthesis.
     - **ElevenLabs Voice Studio Ultra**: Broadcast narrative voiceover stems.
     - **Higgsfield Neural Master 4K & Denoise**: 4K upscaling, optical deblur, and Kodak 35mm grain matching.

4. **Profitability & Unit Economics Panel**:
   - Real-time margin cascade: Client Contract Price, Higgsfield GPU Spend, Iteration Contingency Buffer (default 15%), Marketplace Channel Fee, and Expected Net Gross Margin (% and $).

5. **Operational Console**:
   - Pipeline Kanban grouped into 7 stages:
     - `New`: Fresh intake awaiting analysis.
     - `Needs Review`: Analysis complete / rights issue flagged / awaiting operator approval.
     - `Approved`: Production plan and budget ceiling locked.
     - `Generating`: Autonomous model execution inside authorized limits.
     - `QA`: All renders completed; operator quality check.
     - `Delivered`: Operator-approved final handoff.
     - `Rejected`: Scope/budget mismatch.

6. **Interactive Media Outputs & Revision Log**:
   - Integrated HTML5 video players, high-res image viewers, and voiceover audio players.
   - Provider request IDs (`hg_req_...`), render latencies, and actual incurred costs.
   - Inbound revision tracking with incremental budget approval.

---

## 📦 Tech Stack & Architecture

- **Framework**: Next.js 14 (App Router, React 18, TypeScript)
- **Styling**: Tailwind CSS with dark operational aesthetic
- **Icons**: Lucide React
- **Persistence Layer**: Decoupled Repository Pattern (`IJobRepository`) backed by a JSON document store (`.data/studio_store.json`), allowing seamless migration to PostgreSQL without touching application business logic.
- **Mock Mode**: Fully operational out of the box with zero required API keys (`MOCK_MODE=true`).

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
DEFAULT_CHANNEL_FEE_PCT=10
DEFAULT_CONTINGENCY_PCT=15
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run End-to-End Verification Test
```bash
node test-e2e.mjs
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
