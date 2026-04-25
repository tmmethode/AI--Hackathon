# Umurava Screening — AI-Powered Recruiting Platform

A full-stack hiring workflow that ingests applicants from multiple sources, runs Gemini-powered AI screening against job-specific scoring criteria, and gives recruiters a guided pipeline from shortlist to interview to hire.

Built for the **Umurava AI Hackathon** and conformant to the official [Talent Profile Schema Specification](#talent-profile-schema).

---

## Table of contents

- [Highlights](#highlights)
- [Architecture](#architecture)
- [Repository layout](#repository-layout)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Talent Profile Schema](#talent-profile-schema)
- [Recruiter workflow](#recruiter-workflow)
- [AI features](#ai-features)
- [Verification & testing](#verification--testing)
- [Deployment](#deployment)
- [Tech stack](#tech-stack)

---

## Highlights

- **Job requisitions** with weighted scoring criteria (Must-have, Nice-to-have, Hard & Soft Skills, Experience, Education) — the weights drive the AI screening.
- **Multi-source applicant ingest** — Umurava Platform JSON (canonical schema), CSV, PDF/DOC resume upload, paste-link queueing.
- **Strict Talent Profile Schema enforcement** at write time (Mongoose validators with controlled vocabularies for skill levels, language proficiencies, availability statuses/types; date-format regex; non-empty required arrays; per-job email uniqueness).
- **AI screening** with Gemini batch scoring, weighted final score, ranked shortlist, narrative strengths/gaps, chunk-failure visibility.
- **Pipeline tracking** — Shortlisted → Interview → Technical Exam → Assessment → Practical with persistence (`pipelineStatus` on each shortlist entry) and live cross-page sync via window-focus listeners.
- **AI Assistant** — page-aware chat that auto-scopes to the job/shortlist the user is viewing, sees pipeline stage counts, and grounds every answer in saved screening data.
- **Spec-compliant exports** — CSV / PDF / JSON with optional spec-format key transform (PascalCase-with-spaces variants like `"Start Date"`, `"Field of Study"`).
- **Insight-rich dashboard** — Pipeline Health KPI card, run-by-run match-score sparkline, distribution badges, filterable runs table.

---

## Architecture

```
┌─────────────────────────┐       HTTP / JWT        ┌──────────────────────────────┐
│  Next.js 16 frontend    │ ◀──────────────────────▶│  Express + tsoa backend      │
│  (App Router, RSC,      │                         │  (TypeScript, REST, Swagger) │
│   Tailwind, Redux       │                         └──────────────┬───────────────┘
│   Toolkit, Lucide)      │                                        │
│                         │                            ┌───────────┴────────────┐
│  • Server / API routes  │                            ▼                        ▼
│  • Page-aware AI panel  │                    ┌──────────────┐        ┌──────────────────┐
│  • SVG-only charts      │                    │  MongoDB     │        │  Gemini REST API │
└─────────────────────────┘                    │  (Mongoose)  │        │  (chunked batch  │
                                               │              │        │   scoring +      │
                                               │  Job /       │        │   narratives +   │
                                               │  Applicant / │        │   recruiter      │
                                               │  Shortlist / │        │   assistant)     │
                                               │  User        │        └──────────────────┘
                                               └──────────────┘
```

**Flow at a glance**

1. Recruiter creates a job with weighted scoring criteria.
2. Applicants are ingested through one of four paths; every record is normalized + canonicalized to the spec, then saved with strict validation.
3. Recruiter triggers a screening run → backend chunks parsed applicants, calls Gemini for each chunk, re-ranks, picks `≥ 54%` matches, runs a narrative pass for strengths/gaps, persists a `Shortlist` document.
4. Recruiter works the shortlist on Selected Candidates / Shortlists pages, advancing or rejecting candidates. Status changes persist via `PATCH /shortlists/{id}/candidates/{email}` and propagate to History, Exports, AI Assistant.
5. Reports flow out as CSV / PDF / JSON, with the JSON optionally re-emitted in PascalCase-with-spaces "spec-format" keys.

---

## Repository layout

```
.
├── backend/                # Express + tsoa REST API (port 3001)
│   ├── controllers/        # 9 tsoa controllers (auth, jobs, applicants, shortlists, gemini, assistant, ...)
│   ├── gemini/             # Gemini client, batch screening runner, prompt builders, assistant
│   ├── models/             # Mongoose models (Applicant, Job, Shortlist, User)
│   ├── utils/              # applicant-profile normalizer, http error
│   ├── interfaces/         # tsoa-friendly DTOs
│   ├── generated/          # Auto-generated tsoa routes (do not edit)
│   ├── docs/               # Auto-generated swagger.json
│   └── README.md
│
├── frontend/               # Next.js 16 App Router (port 3000)
│   ├── app/(app)/          # Auth-gated workspace pages
│   │   ├── dashboard/      # Pipeline health + recent runs + sparkline
│   │   ├── jobs/           # Jobs list, create/edit, weighted scoring criteria
│   │   ├── ingest/         # Umurava Platform / Resume / CSV / Links ingest
│   │   ├── screening/      # Trigger screening run + progress page
│   │   ├── shortlists/     # Shortlist results, compare, advance/reject
│   │   ├── candidates/     # Selected Candidates list + AI Summary / Full CV detail
│   │   ├── history/        # Run history + per-run pipeline stage breakdown
│   │   ├── exports/        # CSV / PDF / JSON exports with spec-format toggle
│   │   ├── notifications/  # In-app notification center
│   │   └── settings|profile|users|terms|privacy|...
│   ├── app/api/            # Next.js Route Handlers (favicon, candidates aggregator)
│   ├── components/         # ui/ primitives, layout/ shell, assistant/ AI panel
│   └── lib/                # API clients (jobs, applicants, shortlists, screening, assistant, ...)
│
├── package.json            # Root workspace scripts (dev, build, start across both apps)
└── finance_applicants_50.json   # Sample dataset shaped to the Talent Profile Schema
```

---

## Quick start

### Prerequisites

- **Node.js** 18.17+ (or 20+)
- **MongoDB** 6+ (local or Atlas)
- **Gemini API key** (Google AI Studio → "Generative Language API")

### One-shot install (root)

```bash
git clone git@github.com:tmmethode/AI--Hackathon.git
cd AI--Hackathon
npm install              # postinstall fans out to backend + frontend
```

### Configure environments

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
# then edit both files — see "Environment variables" below
```

### Run both apps

```bash
npm run dev              # starts backend (3001) and frontend (3000) in parallel
```

| URL | What it serves |
|---|---|
| http://localhost:3000 | Frontend (redirects to `/login`) |
| http://localhost:3001 | Backend (redirects to `/docs`) |
| http://localhost:3001/docs | Swagger UI for the REST API |

### Run individually

```bash
npm run dev:backend      # tsoa routes + nodemon, restarts on changes
npm run dev:frontend     # next dev with hot reload
```

### Production build

```bash
npm run build            # builds backend bundle + next production build
npm start                # runs both compiled apps
```

---

## Environment variables

### `backend/.env`

| Variable | Purpose |
|---|---|
| `PORT` | Backend port (default `3001`) |
| `MONGODB_URI` | Mongo connection string |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | JWT signing key + lifetime |
| `SESSION_SECRET` | Express session secret |
| `FRONTEND_URL` | Allowed CORS origin (default `http://localhost:3000`) |
| `GEMINI_API_KEY` | Google AI Studio key — required for screening + AI Assistant |
| `GEMINI_MODEL` | Override (default `gemini-2.5-flash-lite`) |
| `GEMINI_BASE_URL` | Override the Generative Language base URL |
| `GEMINI_MAX_OUTPUT_TOKENS` | Token cap per response (default 1200) |
| `GEMINI_FRONTEND_DEFAULT_SHORTLIST_SIZE` | Default shortlist cap surfaced in the UI |
| `GEMINI_FRONTEND_MIN_SHORTLIST_SIZE` / `GEMINI_FRONTEND_MAX_SHORTLIST_SIZE` | UI clamp for the shortlist size selector |
| `GEMINI_SCREEN_BATCH_MAX_APPLICANTS` | Cap on how many applicants reach a single screening run |
| `EMAIL_SERVICE` / `EMAIL_USER` / `EMAIL_PASS` | Transactional email (verification flows) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_CALLBACK_URL` | OAuth Google sign-in |

### `frontend/.env.local`

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend base URL the browser hits (e.g. `http://localhost:3001`) |

---

## Talent Profile Schema

The [Talent Profile Schema Specification](https://github.com/tmmethode/AI--Hackathon) is enforced top-to-bottom:

| Section | What's enforced |
|---|---|
| §3.1 Basic Info | `firstName`, `lastName`, `email` (unique per job), `headline`, `location` are required. `bio` optional. |
| §3.2 Skills & Languages | `skills` non-empty; `level` ∈ `Beginner / Intermediate / Advanced / Expert`. `languages` optional; `proficiency` ∈ `Basic / Conversational / Fluent / Native`. |
| §3.3 Experience | Non-empty array; `company` + `role` required; `startDate` / `endDate` match `YYYY-MM` (or `Present`). |
| §3.4 Education | Non-empty; `institution` required; year range 1950..currentYear+10. |
| §3.5 Certifications | Optional; `issueDate` matches `YYYY-MM`. |
| §3.6 Projects | Non-empty; date format `YYYY-MM`. |
| §3.7 Availability | Required object; `status` ∈ enum, `type` ∈ enum; `startDate` matches `YYYY-MM-DD`. |
| §3.8 Social Links | Optional. |

**Where the rules live:**
- [`backend/models/Applicant.ts`](backend/models/Applicant.ts) — Mongoose validators (`enum`, `match`, non-empty, conditional `required`).
- [`backend/utils/applicant-profile.ts`](backend/utils/applicant-profile.ts) — `canonicalizeEnum()` collapses case variants on ingest; `normalizeYearMonth()` / `normalizeYearMonthDay()` coerce common date inputs.
- [`backend/gemini/types.ts`](backend/gemini/types.ts) — `GeminiSkillLevel`, `GeminiLanguageProficiency`, `GeminiAvailabilityStatus`, `GeminiAvailabilityType` literal-union types mirror the spec; `GeminiBatchApplicant` requires every spec-required field.
- [`frontend/app/(app)/ingest/page.tsx`](frontend/app/(app)/ingest/page.tsx) — `EXAMPLE_JSON_SCHEMA` ships two applicants demonstrating the full controlled vocabulary; Edit Applicant modal performs the same required-field check before sending PATCH.

**Pending placeholders.** Records created with `ingestStatus: 'pending'` (deferred PDF/link parses when Gemini is unavailable) bypass the strict validators. The same record is re-validated when it's re-saved as `parsed`. The screening pipeline filters to `parsed` only, so the LLM never sees incomplete profiles.

---

## Recruiter workflow

1. **Create a job** (`/jobs/new`). Set scoring weights — these drive the AI's final score.
2. **Ingest applicants** (`/ingest`). Default tab is **Umurava Platform** (canonical JSON). Resume Upload, CSV, and Paste Links also supported. Live preview lists the saved records with status / source filters and rows-per-page.
3. **Trigger a screening run** (`/screening`). Pick the target job, set shortlist size, optionally add recruiter instructions. Backend chunks applicants and calls Gemini.
4. **Review results** (`/screening/progress` then `/shortlists`). Compare candidates side-by-side, advance them through the pipeline, or reject — every change persists.
5. **Work the pipeline** (`/candidates` — *Selected Candidates*). Filter by stage, see per-stage counts, click into each candidate for the **AI Summary** or **Full CV** view (with PDF download).
6. **Track over time** (`/history`). Per-run pipeline stage breakdown, average match, top match, average screening runtime, weekly throughput.
7. **Export** (`/exports`). CSV / PDF / JSON, with optional Talent-Profile-Schema PascalCase-with-spaces key formatting on the JSON download.

---

## AI features

### Batch screening
- One Gemini call per chunk of applicants. Each chunk is scored against the job's authoritative criteria; the caller re-computes the weighted final score.
- Failed chunks are tracked and surfaced to the recruiter (count + first 3 reasons) on the screening progress page.
- Eligibility threshold: `matchScore >= 54`. Final shortlist is min(`shortlistCount`, eligible).

### Narrative enrichment
- Second Gemini pass writes recruiter-friendly strengths, gaps, and a one-paragraph summary per shortlisted candidate — does not change scores or ranks.

### AI Assistant (recruiter chat)
- Page-aware: auto-scopes to the shortlist or job derived from the URL (`/shortlists?id=…`, `/candidates/[id]`).
- Sees `pipelineStatus` per shortlist entry and a `PIPELINE STAGE COUNTS:` summary, so questions like *"How many candidates are in interview?"* answer accurately.
- Uses persisted screening data only — no invented qualifications. System rules cite the spec when explaining what's required.

### Spec-format JSON exports
- Optional toggle in the Exports modal re-emits PascalCase-with-spaces keys (`"Start Date"`, `"End Date"`, `"Is Current"`, `"Field of Study"`, `"Start Year"`, `"End Year"`, `"Issue Date"`) so downstream consumers that follow the PDF spec verbatim get a perfect match.

---

## Verification & testing

### Type checks (run from each app's directory)

```bash
cd backend  && ./node_modules/.bin/tsc --noEmit -p tsconfig.json
cd frontend && ./node_modules/.bin/tsc --noEmit -p tsconfig.json
```

Both should produce no output and exit 0.

### Backend regenerate routes after editing controllers

```bash
cd backend && npx tsoa routes && npx tsoa spec
```

`backend/generated/routes.ts` and `backend/docs/swagger.json` are auto-generated — never hand-edit them.

### Manual smoke test

1. `npm run dev` — both apps start.
2. Sign in at `/login`. Create a job (set non-zero weights summing to 100).
3. Go to `/ingest` → **Umurava Platform** tab. Click **View Example Schema** to copy the canonical JSON, paste into a `.json` file, drop it on the upload area.
4. Trigger a screening run from `/screening`. Watch `/screening/progress` for completion and any chunk-failure banners.
5. On `/shortlists` advance one candidate to **Interview** and reject another. Both changes should be reflected immediately on `/candidates` and `/history` (focus listeners).
6. Open `/exports` → preview / download CSV — confirm the new pipeline-stage column and the trailing stage-counts summary.

---

## Deployment

The repo is structured as two deployable apps:

- **Backend** (`backend/`) — bundled by `tsup` into `dist/index.mjs`. Compatible with any Node 18+ host (Render, Fly, Railway, AWS, container). Set the env vars listed above, ensure MongoDB connectivity.
- **Frontend** (`frontend/`) — Next.js 16 App Router, deploys cleanly to Vercel. Set `NEXT_PUBLIC_API_URL` to the public backend origin.

Cross-app concerns:
- Set `FRONTEND_URL` on the backend to the deployed frontend origin so CORS allows it.
- The backend redirects `/` to `/docs` only when MongoDB connects successfully — useful as a health probe target.

---

## Tech stack

**Backend:** TypeScript · Express 4 · tsoa 6 (auto OpenAPI/Swagger) · Mongoose 8 · Passport (JWT + Google OAuth) · pdf-parse + mammoth + word-extractor (resume parsing) · Google Generative Language REST API.

**Frontend:** TypeScript · Next.js 16 (App Router, RSC) · React 19 · Redux Toolkit · Tailwind CSS 3 · Lucide icons · react-markdown (assistant chat).

**Tooling:** tsoa for route + swagger generation · tsup for backend bundling · ESLint · Custom design tokens via Tailwind.

---

## License

Internal hackathon project — see Umurava.
