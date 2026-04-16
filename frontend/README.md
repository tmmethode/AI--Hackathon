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

Open [http://localhost:3000](http://localhost:3000). The root URL redirects to `/dashboard`.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Create a production build |
| `npm start` | Run the production build |
| `npm run lint` | Lint the project |
| `npm run typecheck` | Type-check without emitting |

## Routes

- `/dashboard` — Recruiter dashboard
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
