# Umurava Screening

AI-powered recruiting and candidate screening platform. Next.js 14 (App Router) + TypeScript + Tailwind CSS, built from a Figma design.

## Prerequisites

- Node.js 18.17+ (or 20+)
- npm (or pnpm / yarn)

## Install

```bash
git clone git@github.com:tmmethode/AI--Hackathon.git
cd AI--Hackathon
npm install
```

## Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The root URL redirects to `/login`.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Create a production build |
| `npm start` | Run the production build |
| `npm run lint` | Lint the project |
| `npm run typecheck` | Type-check without emitting |

## Build troubleshooting

If `npm run build` fails intermittently on `/jobs/new` with errors similar to:

- `TypeError: Cannot read properties of null (reading 'useMemo')`
- `Error occurred prerendering page "/jobs/new"`

use the following checklist:

1. Ensure `NODE_ENV` is set to a standard value (`production`, `development`, or `test`). A custom value can cause inconsistent Next.js behavior.
2. Remove stale build artifacts and rebuild:

   ```bash
   rm -rf frontend/.next
   npm --prefix frontend run build
   ```

3. If warnings mention multiple lockfiles, run builds from the repository root (`AI--Hackathon/`) to avoid incorrect workspace-root inference.

## Routes

- `/dashboard` — Recruiter dashboard
- `/login` — Recruiter sign-in
- `/jobs` — Jobs list & detail
- `/jobs/new` — Create / edit a screening job
- `/ingest` — Ingest applicants
- `/screening` — Screening trigger & confirmation
- `/shortlists` — Shortlist results
- `/candidates/[id]` — Candidate detail
- `/history` — History & settings
- `/exports` — Exports

## Project structure

```
app/            Next.js App Router routes (grouped under (app) for the shell layout)
components/     Reusable UI primitives and layout shell
lib/            Small utilities (e.g. cn helper)
tailwind.config.ts   Design tokens (colors, fonts, shadows)
```
