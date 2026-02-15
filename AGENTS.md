# AGENTS.md

Instructions for AI coding agents working on this repo. See [agents.md](https://agents.md) for the format.

## Project overview

- **Monorepo:** `/backend` (Node.js, Express, Drizzle, Postgres) and `/frontend` (Svelte 5 + Vite). Single root `.env` for both.
- **Purpose:** Daily stock/fund recommendations; watchlist + manual notes; AI + market data (Finnhub US, Alpha Vantage ex-US). Memory in DB so it survives deploys.
- **Automation:** All commands from repo root via [Task](https://taskfile.dev/) – use `task <name>`, not raw npm/docker.

## Setup commands

- Install deps (root + backend + frontend): `task install`
- **Run app for development:** `task run` or `task start` or `task dev` — starts Postgres (Docker), waits for DB, runs migrations, then starts backend + frontend locally (concurrently). One command for full local dev.
- Build: `task build`
- CI (npm ci + build): `task ci`
- DB migrate: `task db:migrate` (run from root; backend uses root `.env`)
- Run full stack in Docker (db + app container): `task run:docker`

## Code style and conventions

- **Backend:** TypeScript, ESM (`"type": "module"`). Config in `backend/src/config/`, DB in `backend/src/db/`. Use root `.env` (loaded via path in `env.ts` and `drizzle.config.cjs`).
- **Frontend:** Svelte 5 with **runes** (`$state`, `$derived`, `$effect`). Single quote, semicolons optional; match existing style.
- **Task, not npm/docker:** Prefer adding or using Taskfile tasks over documenting one-off npm or docker-compose commands in README.

## i18n (internationalization)

Instructions for AI tools and contributors: keep the UI localized and consistent.

### Rules

1. **No hardcoded user-facing strings** in Svelte (or any frontend code). Every label, title, button text, message, and placeholder must use the i18n function.
2. **Use `t('key')`** from `$lib/i18n`:  
   `import { t } from '$lib/i18n/index.js';` then e.g. `t('nav.dashboard')`, `t('common.loading')`. Keys are dot-path strings into the locale JSON.
3. **Add or edit keys in both locale files** with the same structure:
   - `frontend/locales/en.json`
   - `frontend/locales/sv.json`  
   Add the same key path in both; keep section and nesting identical (e.g. `watchlist.yourWatchlist` in en and sv).
4. **Supported locales:** English (`en`) and Swedish (`sv`) only. Do not add a new locale unless the task explicitly asks for it; when adding one, see `docs/I18N.md`.
5. **Locale switcher:** The app uses a **dropdown (&lt;select&gt;)** with a **flag emoji** next to the language name (🇺🇸 English, 🇸🇪 Svenska). Options come from `localeOptions` in `$lib/i18n` (code, labelKey, flag). Do not replace this with plain buttons.
6. **Persistence:** The selected locale is stored in **localStorage** under `stonksgpt-locale`. Initial locale is: saved value → browser language (sv if `navigator.language` starts with `sv`) → default `en`. Do not change this key or the init order without good reason.

### Checklist when adding UI text

- [ ] Added the key to **both** `frontend/locales/en.json` and `frontend/locales/sv.json` in the same place in the tree.
- [ ] Used `t('section.key')` (or `t('key', params)` if the string has placeholders) in the component; no raw string in the template for that text.
- [ ] If the string is used in a reactive context (e.g. derived label), the code reads `$locale` so the UI updates when the user changes language.

### Reference

- **Full i18n doc:** `docs/I18N.md` – locale files, `t()` and store usage, adding keys, adding a new locale.
- **i18n module:** `frontend/src/lib/i18n/index.js` – `t()`, `locale`, `setLocale`, `initI18n`, `localeOptions`, `supportedLocales`.

## Database

- Schema and migrations: Drizzle. Config: `backend/drizzle.config.cjs` (CJS so drizzle-kit works with `"type": "module"`). Migrations live in `backend/drizzle/`. After changing schema, run `task db:migrate` from root (or `npm run db:generate` in backend to create a new migration, then migrate).
- Postgres credentials and `DATABASE_URL` come from root `.env` (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`). Docker Compose reads them from the same `.env`.

## Optional / context

- App runs without AI and market-data API keys (placeholder recommendations); see `hasAiKey()`, `hasMarketDataKeys()`, `canRunRecommendations()` in `backend/src/config/env.ts`.
- Docs: `/docs` (architecture, data sources, AI/MCP, future plans). README is for humans; AGENTS.md and docs are for agents and deeper context.
