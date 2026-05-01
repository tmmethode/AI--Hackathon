# Umurava Screening — Frontend

The recruiter-facing web app for the Umurava Screening platform. Built with **Next.js 16** (App Router + React 19 RSC), **TypeScript**, **Tailwind CSS**, **Redux Toolkit**, **Lucide** icons, and a fully token-driven design system.

> Default port: **3000** · Backend it talks to: configured via `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:3001` in `.env.example` for this repo).

## Features

- **Recruiter dashboard** with Pipeline Health KPIs, top-match sparkline, run-distribution badges, and a filterable recent-runs table.
- **Job requisitions** (`/jobs`) — list, create / edit, weighted scoring criteria with auto-rebalancing, archive, soft delete, view modal, AI-powered job import from public links / PDF.
- **Multi-source applicant ingest** (`/ingest`) — Umurava Platform (canonical JSON, default tab), Resume upload, CSV import, paste links. Resume files and public links are parsed through Gemini when available, with faster timeout/error handling and pending-placeholder fallback if parsing cannot complete. Live preview includes status / source filters and rows-per-page; CSV / JSON template downloads; spec-aligned **Edit Applicant** modal with structured per-section editors and required-field validation.
- **Screening** (`/screening`) — pick target job + shortlist size, optional recruiter instructions, start an async screening run, then watch the progress page with chunk-failure visibility.
- **Shortlists** (`/shortlists`) — ranked candidate cards, side-by-side compare modal, advance / reject (persists via PATCH), match-tier and status filters, page-size selector.
- **Selected Candidates** (`/candidates`) — pipeline view with stat tiles (clickable), inline stage badges, AI Summary / Full CV split via `?view=cv` deep-link, list-style compact rows.
- **Candidate detail** (`/candidates/[id]`) — AI Summary tab (recommendation, scores, strengths, gaps, recruiter notes) + Full CV tab (professional summary, experience, education, projects, certifications, languages, downloads — including spec-format PDF CV).
- **Screening History** (`/history`) — per-run pipeline stage breakdown, average match, top match, average runtime, weekly throughput, CSV export.
- **Exports** (`/exports`) — CSV / PDF / JSON downloads with optional **spec-compliant keys** toggle (PascalCase-with-spaces variants from the Talent Profile Schema PDF).
- **AI Assistant** — floating chat panel that auto-scopes to the current page (job / shortlist / candidate), grounds answers in saved data, sees `pipelineStatus` per shortlist entry.

## Prerequisites

- **Node.js** 18.17+ (or 20+)
- **npm** (or pnpm / yarn)

## Install

```bash
git clone git@github.com:tmmethode/AI--Hackathon.git
cd AI--Hackathon
npm install              # postinstall fans out to backend + frontend
```

If you only want the frontend dependencies:

```bash
cd frontend
npm install
```

## Configure

```bash
cp .env.example .env.local
# edit NEXT_PUBLIC_API_URL to point at the backend
```

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL the browser and Next route handlers hit (e.g. `http://localhost:3001`) |

## Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The root URL redirects to `/login`; sign in to enter the workspace.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Create a production build |
| `npm start` | Run the production build |
| `npm run lint` | Lint the project |
| `npm run typecheck` | Type-check without emitting |

## Routes

### Auth
- `/login` — Sign in (JWT, optional Google OAuth)
- `/auth/callback` — OAuth landing
- `/terms` · `/privacy` — Static legal pages

### Workspace (auth-gated, under `app/(app)/`)
- `/dashboard` — Recruiter dashboard (KPIs, sparkline, recent runs)
- `/jobs` — Jobs list + sidebar quick-inspection
- `/jobs/new` — Create / edit a screening job
- `/ingest` — Multi-source applicant ingest (default tab: **Umurava Platform**)
- `/screening` — Trigger a screening run
- `/screening/progress` — Async run progress + result preview
- `/shortlists` — Shortlist results, compare, advance / reject
- `/candidates` — **Selected Candidates** pipeline (only active stages — `rejected` and `new` are filtered out)
- `/candidates/[id]` — Candidate detail (AI Summary by default, CV via `?view=cv`)
- `/history` — Run history with per-run pipeline stage breakdown
- `/exports` — CSV / PDF / JSON downloads
- `/notifications` — In-app notification center
- `/settings` · `/profile` · `/users/new` — Account & admin

## Project structure

```
frontend/
├── app/
│   ├── (app)/                 # Auth-gated workspace shell + routes
│   │   ├── candidates/        #   Selected Candidates list + [id] detail page
│   │   ├── dashboard/
│   │   ├── exports/
│   │   ├── history/
│   │   ├── ingest/            #   Umurava Platform / Resume / CSV / Links
│   │   ├── jobs/              #   List, [id], new
│   │   ├── notifications/
│   │   ├── profile/
│   │   ├── screening/         #   index + progress
│   │   ├── settings/
│   │   ├── shortlists/        #   List, compare modal
│   │   ├── users/new/
│   │   └── layout.tsx         #   AuthGate + SessionManager + AppShell
│   ├── api/                   # Next.js Route Handlers
│   │   ├── candidates/route.ts   # Aggregated candidates endpoint (active-only by default)
│   │   └── (favicon route handler)
│   ├── login/                 # Sign-in page
│   ├── icon.svg               # Brand-blue SVG favicon
│   ├── favicon.ico/route.ts   # Brand-blue SVG served at /favicon.ico
│   ├── globals.css            # Tailwind base + design tokens
│   ├── layout.tsx             # Root layout (StoreProvider, fonts, metadata)
│   └── page.tsx               # Root → /login
│
├── components/
│   ├── ui/                    # Card, Button, Badge, Input, Modal, Select, Avatar, Progress, Skeleton
│   ├── layout/                # AppShell, Sidebar, Topbar, PageHeader, Footer
│   ├── auth/                  # AuthGate, SessionManager (idle timeout + warning)
│   ├── assistant/             # Floating AI Assistant panel + scope dropdown
│   ├── providers/             # StoreProvider (Redux), ThemeProvider
│   └── page-skeletons.tsx     # Loading skeletons per page
│
├── lib/                       # Typed API clients + helpers
│   ├── auth.ts · auth-session.ts   # Token storage, refresh, idle timer constants
│   ├── jobs.ts · job-import.ts     # /jobs API client + AI import
│   ├── applicants.ts               # /applicants API client
│   ├── candidates.ts               # /api/candidates aggregator client
│   ├── candidate-directory.ts      # Directory listing helpers
│   ├── shortlists.ts               # /shortlists API client + PATCH pipelineStatus
│   ├── screening.ts · screening-progress.ts   # /gemini/screen-* clients
│   ├── assistant.ts                # /gemini/assistant client (page-aware chat)
│   ├── dashboard.ts                # /dashboard/summary client
│   ├── notifications.ts            # /notifications client
│   ├── applicant-profile.ts        # rawPayload → structured sections
│   ├── experience.ts               # Years-of-experience derivation
│   ├── pdf.ts                      # Pure-JS PDF builder (CV + AI Report)
│   ├── download.ts                 # Browser download helpers (CSV / JSON / Blob)
│   ├── cn.ts                       # Tailwind class joiner
│   ├── hooks.ts                    # Typed Redux hooks
│   └── features/                   # Redux Toolkit slices (jobs, jobForm, ...)
│
├── public/                    # (empty — SVG favicon lives in app/)
├── tailwind.config.ts         # Design tokens (brand blue, ink, surface scale, fonts, shadows)
├── postcss.config.cjs
├── next.config.ts
├── tsconfig.json
└── .env.example
```

## Design system

All colors / fonts / shadows live in `tailwind.config.ts` as CSS variables (`--color-brand`, `--color-ink`, `--color-surface`, …) so the look is consistent across pages.

- **Brand color:** `#1f8cf9` (used by the favicon, primary buttons, accents)
- **Fonts:** Inter (UI) + Open Sans (display) via `next/font/google`
- **Cards:** `bg-surface rounded-card shadow-card border border-line` via the shared `.card` utility
- **Form inputs:** Hover and focus-visible states baked into the shared `Input` component

When adding UI, prefer the components in `components/ui/` and the shared layout pieces in `components/layout/` over building one-off styles.

## State management

- **Server state:** fetched via the typed clients in `lib/*.ts` (no React Query — direct `fetch` with the auth token from `lib/auth.ts`).
- **Client state:** small slices in `lib/features/` powered by Redux Toolkit (`jobs`, `jobForm`). Most pages keep local state via `useState` / `useMemo`.
- **Session:** `components/auth/SessionManager.tsx` enforces idle + absolute session expiry, shows a "Session expiring soon" modal with a countdown, and forces sign-out when the session ends.

## AI Assistant integration

The floating panel in `components/assistant/AIAssistant.tsx`:

- Reads `usePathname()` + `useSearchParams()` and auto-scopes to the matching shortlist (`/shortlists?id=…`) or job (`/candidates/[id]`).
- Pre-fetches the Gemini health + scope data on idle so the panel opens instantly.
- Renders responses as Markdown via `react-markdown` + `remark-gfm` + `remark-breaks`. Markdown styling is tightened so bullet lists feel compact (no ballooned paragraph spacing).
- Surfaces a context summary chip beneath each assistant message ("Live context", "Workspace overview", "Acme Labs · 12 shortlisted").

## Talent Profile Schema in the UI

- The **Umurava Platform** ingest tab ships a complete `EXAMPLE_JSON_SCHEMA` (two applicants exercising every controlled-vocabulary value, including `endDate: "Present"` + `isCurrent: true`).
- The **Edit Applicant** modal uses `<Select>` controls bound to the spec values for skills.level, languages.proficiency, availability.status, availability.type. Required-field markers on Headline, Location, Availability, plus a pre-submit check that rejects incomplete updates with a single banner-friendly error.
- **Exports** modal exposes a **Spec-compliant keys** toggle that re-emits the JSON download with PascalCase-with-spaces field names (`"Start Date"`, `"End Date"`, `"Field of Study"`, `"Start Year"`, `"End Year"`, `"Issue Date"`, `"Is Current"`).

## Build troubleshooting

If `npm run build` fails intermittently on `/jobs/new` with errors like:

- `TypeError: Cannot read properties of null (reading 'useMemo')`
- `Error occurred prerendering page "/jobs/new"`

try this checklist:

1. Ensure `NODE_ENV` is set to a standard value (`production`, `development`, or `test`). A custom value can cause inconsistent Next.js behavior.
2. Remove stale build artifacts and rebuild:
   ```bash
   rm -rf frontend/.next
   npm --prefix frontend run build
   ```
3. If warnings mention multiple lockfiles, run builds from the repository root (`AI--Hackathon/`) so Next infers the correct workspace root.

## Deploying

The app is a standard Next.js 16 deployment — Vercel, Netlify, Fly, or any Node 20+ host that can run `next start`.

- Set `NEXT_PUBLIC_API_URL` to the public backend origin in your hosting environment.
- Make sure the backend's `FRONTEND_URL` env var matches the public frontend origin so CORS allows it.
