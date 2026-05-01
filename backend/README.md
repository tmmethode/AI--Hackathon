# Umurava Screening — Backend API

Express + tsoa + Mongoose REST API for the Umurava Screening platform. Powers job requisitions, multi-source applicant ingest with strict Talent Profile Schema enforcement, Gemini-powered batch screening, shortlist persistence, and the recruiter AI Assistant.

> Default port: **3001** · Swagger UI: **`/docs`** · OpenAPI spec: `docs/swagger.json` (auto-generated)

## Highlights

- **Auto-generated REST contract.** tsoa decorators on the controllers produce `generated/routes.ts` and `docs/swagger.json` on every build; the swagger UI is mounted at `/docs`.
- **Talent Profile Schema enforcement.** `Applicant` model rejects bad data at write time — required `headline` / `location`, controlled vocabularies for skill levels / language proficiencies / availability statuses & types, regex-validated YYYY-MM / YYYY-MM-DD dates, year-range checks on education, non-empty array validators for skills / experience / education / projects, compound unique index on `{ job, email }`.
- **Conditional strictness for deferred ingest.** Pending placeholder records (PDF / link queues waiting for AI parsing) bypass the strict validators via a `requiresStructuredProfile()` gate, then become spec-strict the moment they're re-saved as `parsed`.
- **Ingest normalization.** `utils/applicant-profile.ts` collapses case variants (`"advanced"` → `"Advanced"`), accepts spec PascalCase-with-spaces aliases (`"Start Date"`, `"Field of Study"`, …), and coerces fuzzy date strings (`"2024"`, `"Jan 2024"`, ISO timestamps) into the spec format.
- **Gemini batch screening.** Chunked batch scoring with weighted final score (using each job's saved scoring weights), async run orchestration, narrative pass for strengths/gaps, eligibility threshold of `≥ 54%`, and transparent chunk-failure tracking surfaced via run status and response meta.
- **Pipeline persistence.** `Shortlist.shortlist[]` carries a `pipelineStatus` field (`shortlisted` | `interview` | `exam` | `assessment` | `practical`); a single `PATCH /shortlists/{id}/candidates/{email}` endpoint moves candidates between stages and rejection.
- **Recruiter AI Assistant.** Page-aware chat that grounds answers in saved screening data, sees pipeline stage counts, and never invents qualifications.

## Stack

- **TypeScript** (strict mode)
- **Express** 4 + **tsoa** 6 (decorators → routes + OpenAPI)
- **Mongoose** 8 (MongoDB)
- **Passport** with JWT + Google OAuth + Local strategies
- **pdf-parse** · **mammoth** · **word-extractor** (resume parsing)
- **Google Generative Language REST API** (Gemini)

## Installation

```bash
npm install
cp .env.example .env
# fill in MONGODB_URI, JWT_SECRET, GEMINI_API_KEY, etc.
```

## Environment variables

See [`.env.example`](.env.example) for the complete list. Every variable in that file is commented line-by-line. Most-used:

| Variable | Default | Notes |
|---|---|---|
| `PORT` | `3001` | API listen port |
| `MONGODB_URI` | — | Required (`mongodb://localhost:27017/<db>`) |
| `JWT_SECRET` | — | Required for auth |
| `JWT_EXPIRES_IN` | `7d` | Lifetime of issued tokens |
| `SESSION_SECRET` | — | Express session signing |
| `FRONTEND_URL` | `http://localhost:3000` | Allowed CORS origin |
| `GEMINI_API_KEY` | — | Required for screening + AI Assistant |
| `GEMINI_MODEL` | `gemini-2.5-flash-lite` | Override the default model |
| `GEMINI_BASE_URL` | Generative Language v1beta | Override the API base URL |
| `GEMINI_MAX_OUTPUT_TOKENS` | `1200` | Per-response token cap |
| `GEMINI_FRONTEND_DEFAULT_SHORTLIST_SIZE` | `10` | Default shortlist size in the UI |
| `GEMINI_FRONTEND_MIN_SHORTLIST_SIZE` / `_MAX_SHORTLIST_SIZE` | `5` / `50` | UI clamp |
| `GEMINI_BATCH_CHUNK_SIZE` | `10` | Applicants per Gemini scoring request |
| `GEMINI_BATCH_MAX_OUTPUT_TOKENS` | `32768` | Batch scoring output budget |
| `GEMINI_BATCH_SCORING_CONCURRENCY` / `GEMINI_BATCH_NARRATIVE_CONCURRENCY` | `2` / `2` | In-run parallelism |
| `GEMINI_ASYNC_DB_CHUNK_SIZE` | `20` | Mongo fetch batch size for async runs |
| `GEMINI_PERSISTED_SCREENING_RESULT_LIMIT` | `500` | Preview results copied onto the shortlist document |
| `GEMINI_SCREEN_BATCH_MAX_APPLICANTS` | `200` | Hard cap for the legacy synchronous `POST /gemini/screen-batch` endpoint |

## Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Regenerate tsoa artifacts then start nodemon (auto-restart on save) |
| `npm run build` | Regenerate tsoa artifacts → `tsc` → bundle with `tsup` to `dist/index.mjs` |
| `npm start` | Run the production bundle |

## Project structure

```
backend/
├── controllers/           # tsoa controllers — source of truth for routes
│   ├── ApplicantController.ts   # CRUD + ingest (Umurava JSON, CSV, files, links)
│   ├── AuthController.ts        # Login, register, /me, JWT, Google OAuth callback
│   ├── DashboardController.ts   # Aggregated metrics surfaced on /dashboard
│   ├── GeminiController.ts      # Direct Gemini endpoints (health, generate, screen, batch)
│   ├── HistoryController.ts     # Run history with per-run pipeline stage counts
│   ├── JobController.ts         # Job requisitions + weighted scoring criteria
│   ├── NotificationController.ts # In-app notifications
│   ├── ShortlistController.ts   # Persisted shortlists + PATCH candidate pipelineStatus
│   └── SidebarController.ts     # Live workspace counters for the sidebar
│
├── gemini/
│   ├── client.ts                 # Gemini REST client wrapper
│   ├── config.ts                 # Centralized env + frontend defaults
│   ├── screening.ts              # Single-candidate + batch screening service
│   ├── async-screening-runner.ts # Async screening runs persisted in MongoDB
│   ├── batch-screening-runner.ts # Legacy DB-driven synchronous batch runner
│   ├── applicant-import.ts       # PDF / link parse → spec-shaped applicant
│   ├── job-import.ts             # Public job posting parser
│   ├── frontend.ts               # Frontend-facing screening helper
│   ├── assistant.ts              # Recruiter AI Assistant context builder
│   ├── prompts.ts                # All Gemini prompt templates + system instructions
│   ├── shortlist-criteria.ts     # Eligibility threshold (≥54%)
│   ├── rubric.ts                 # Weight derivation + final score recomputation
│   └── types.ts                  # Spec-aligned literal-union types
│
├── models/
│   ├── Applicant.ts       # Strict Talent Profile Schema (enums, regex, conditional required)
│   ├── Job.ts             # Job requisition + scoring weights
│   ├── Shortlist.ts       # Final shortlist output + shortlist[] with pipelineStatus
│   ├── ScreeningRun.ts    # Async screening run state, ownership, counters, filters
│   ├── ScreeningResult.ts # Per-applicant persisted scoring/explanation rows
│   └── User.ts            # Recruiter / admin accounts
│
├── interfaces/          # tsoa-friendly DTOs (mirrored from models)
├── utils/
│   ├── applicant-profile.ts   # canonicalizeEnum + normalizeYearMonth + section normalizers
│   └── HttpError.ts
├── middleware/          # Auth middleware, error handler, etc.
├── config/database.ts   # Mongo connection
├── generated/routes.ts  # AUTO-GENERATED — do not edit
├── docs/swagger.json    # AUTO-GENERATED — do not edit
├── index.ts             # Application entry
├── server.ts            # Express setup, middleware, routes mount
├── tsoa.json            # tsoa config
└── tsconfig.json
```

## REST API

### Auth
- `POST /auth/register` — register a new user (admin role required for non-self).
- `POST /auth/login` — issue a JWT.
- `GET /auth/me` — return the authenticated user.
- `POST /auth/refresh` — refresh an expiring JWT.
- `GET /auth/google` / `GET /auth/google/callback` — Google OAuth.

### Jobs
- `GET /jobs` — list (paginated, filterable by status / search).
- `POST /jobs` — create a job + scoring weights.
- `GET /jobs/{id}` — single job detail.
- `PATCH /jobs/{id}` — update a job (recruiter / admin).
- `DELETE /jobs/{id}` — delete (admin / recruiter).
- `POST /jobs/{id}/archive` — flip status to `Closed`.
- `GET /jobs/select` — lightweight selector list (used by AI Assistant scope dropdown).

### Applicants
- `GET /applicants` — list (paginated, filtered by job / status / source / search).
- `POST /applicants/jobs/{jobId}` — bulk-create from `ApplicantProfileInput[]` (Umurava JSON path).
- `POST /applicants/jobs/{jobId}/csv` — bulk-create from CSV rows.
- `POST /applicants/jobs/{jobId}/files` — bulk-create from uploaded PDF / DOCX (parsed via Gemini).
- `POST /applicants/jobs/{jobId}/links` — queue paste-links for deferred parsing.
- `GET /applicants/jobs/{jobId}/{applicantId}` — single applicant.
- `PATCH /applicants/jobs/{jobId}/{applicantId}` — update (full Mongoose validation runs).
- `DELETE /applicants/jobs/{jobId}/{applicantId}` — delete.

### Screening (Gemini)
- `GET /gemini/health` — is Gemini configured and which model.
- `GET /gemini/frontend-config` — defaults / limits / endpoint paths for the frontend.
- `POST /gemini/generate` — generic prompt passthrough.
- `POST /gemini/screen-candidate` — single candidate scored against a job.
- `POST /gemini/screen-run` — frontend-driven screening run across multiple candidates.
- `POST /gemini/screen-batch` — legacy synchronous DB-driven batch run. Still supported, but the main frontend flow now uses async runs instead.
- `POST /gemini/screen-batch-runs` — preferred async screening entrypoint. Creates a persisted `ScreeningRun`, processes applicants in background chunks, and saves per-candidate `ScreeningResult` rows before writing the final `Shortlist`.
- `GET /gemini/screen-batch-runs/{runId}` — load current async run status, counts, failures, shortlist, and ranked results.
- `POST /gemini/assistant` — recruiter chat (page-aware scope, pipeline-status-aware).
- `POST /gemini/parse-applicants` — internal helper used by file / link ingest.
- `POST /gemini/parse-job` — parse a job posting URL into a draft job.

### Shortlists
- `GET /shortlists` — list runs (filterable by job).
- `GET /shortlists/select` — lightweight selector for the AI Assistant + Exports dropdowns.
- `GET /shortlists/{id}` — full shortlist record (screening results + shortlist + weight criteria).
- `POST /shortlists` — persist a screening response.
- `PATCH /shortlists/{id}/candidates/{email}` — move a candidate between pipeline stages (`shortlisted` | `rejected` | `interview` | `exam` | `assessment` | `practical`). Single source of truth for live recruiter actions.
- `DELETE /shortlists/{id}` — delete a run.

### History / Dashboard / Sidebar / Notifications
- `GET /history/summary` — paginated run summaries with per-run `stageCounts` + `averageMatchScore`.
- `GET /dashboard/summary` — aggregated KPIs powering the recruiter dashboard.
- `GET /sidebar/usage` — weekly screening run counter for the sidebar.
- `GET /notifications` / `POST /notifications/{id}/read` / `POST /notifications/mark-all-read`.

### Documentation
- `GET /docs` — Swagger UI.
- `GET /` — redirects to `/docs` when MongoDB is reachable.

## Talent Profile Schema enforcement

Applicants are validated at the model layer using values exported from [`models/Applicant.ts`](models/Applicant.ts):

```ts
export const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'] as const;
export const LANGUAGE_PROFICIENCIES = ['Basic', 'Conversational', 'Fluent', 'Native'] as const;
export const AVAILABILITY_STATUSES = ['Available', 'Open to Opportunities', 'Not Available'] as const;
export const AVAILABILITY_TYPES = ['Full-time', 'Part-time', 'Contract'] as const;
export const DATE_YYYY_MM_REGEX = /^(\d{4}-(0[1-9]|1[0-2])(-\d{2})?|Present)$/i;
export const DATE_YYYY_MM_DD_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
```

Pending placeholders (`ingestStatus: 'pending'`) are exempt via `requiresStructuredProfile()` so deferred PDF/link queues can persist without a complete profile. The screening pipeline filters to `ingestStatus: 'parsed'` only, so the LLM never sees incomplete data.

## Development workflow

```bash
npm run dev
```

Watches the source tree, re-runs `tsoa routes` + `tsoa spec` on every save, and restarts the API. Edit a controller, watch the swagger UI update at `/docs` automatically.

```bash
./node_modules/.bin/tsc --noEmit -p tsconfig.json
```

Type-checks without emitting. Should always be clean before committing.

```bash
npx tsoa routes && npx tsoa spec
```

Manually regenerate the auto-generated route + swagger files (run this if you edit controllers but skip `npm run dev`).

## Deploying

```bash
npm run build      # tsoa + tsc + tsup → dist/index.mjs
npm start          # node dist/index.mjs
```

Compatible with Render, Railway, Fly.io, AWS, or any Node 18+ container host. Make sure `MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, and `FRONTEND_URL` are set in production.
