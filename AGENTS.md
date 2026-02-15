# AGENTS.md

Instructions for AI coding agents working on this repo. See [agents.md](https://agents.md) for the format.

## Project overview

- **Monorepo:** `/backend` (Node.js, Express, Drizzle, Postgres) and `/frontend` (Svelte 5 + Vite). Single root `.env` for both.
- **Purpose:** Daily stock/fund recommendations; watchlist + manual notes; AI + market data (Finnhub US, Alpha Vantage ex-US). Memory in DB so it survives deploys.
- **Automation:** All commands from repo root via [Task](https://taskfile.dev/) – use `task <name>`, not raw npm/docker.

## Setup commands

- Install deps (root + backend + frontend): `task install`
- Start project (DB, wait, migrate, app): `task run`
- Dev (backend + frontend, no Docker; use concurrently): `task dev`. Ensure Postgres is running (e.g. `docker compose up -d db`).
- Build: `task build`
- CI (npm ci + build): `task ci`
- DB migrate: `task db:migrate` (run from root; backend uses root `.env`)

## Code style and conventions

- **Backend:** TypeScript, ESM (`"type": "module"`). Config in `backend/src/config/`, DB in `backend/src/db/`. Use root `.env` (loaded via path in `env.ts` and `drizzle.config.cjs`).
- **Frontend:** Svelte 5 with **runes** (`$state`, `$derived`, `$effect`). Single quote, semicolons optional; match existing style.
- **Task, not npm/docker:** Prefer adding or using Taskfile tasks over documenting one-off npm or docker-compose commands in README.

## i18n (internationalization)

- **User-facing strings** must not be hardcoded. Use the app i18n layer and locale files.
- **Frontend:** Use `t('key')` from `$lib/i18n` (e.g. `t('nav.dashboard')`). Add or update keys in **both**:
  - `frontend/locales/en.json`
  - `frontend/locales/sv.json`
- Keep the same structure in both files; add new keys under the same path (e.g. `"newSection": { "title": "..." }` in en and sv).
- Supported locales: English (`en`) and Swedish (`sv`) only for now.

## Database

- Schema and migrations: Drizzle. Config: `backend/drizzle.config.cjs` (CJS so drizzle-kit works with `"type": "module"`). Migrations live in `backend/drizzle/`. After changing schema, run `task db:migrate` from root (or `npm run db:generate` in backend to create a new migration, then migrate).
- Postgres credentials and `DATABASE_URL` come from root `.env` (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`). Docker Compose reads them from the same `.env`.

## Optional / context

- App runs without AI and market-data API keys (placeholder recommendations); see `hasAiKey()`, `hasMarketDataKeys()`, `canRunRecommendations()` in `backend/src/config/env.ts`.
- Docs: `/docs` (architecture, data sources, AI/MCP, future plans). README is for humans; AGENTS.md and docs are for agents and deeper context.
