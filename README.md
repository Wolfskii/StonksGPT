# StonksGPT

Daily stock and fund recommendations for long-term investing. The app runs a **daily job** that pulls market data and news, combines them with your watchlist and any notes you add, and asks an AI for buy/sell/hold advice. Everything is stored in the **database** so your history and context survive redeploys (e.g. on Dokploy).

## How it works

- You maintain a **watchlist** of symbols (US and ex-US). **Manual notes** (e.g. “RAM shortage from AI capex”) are stored and fed into the daily prompt.
- A **scheduled job** (cron or HTTP) loads the watchlist, fetches **quotes and news** (Finnhub for US, Alpha Vantage for ex-US; Swedish .ST via Yahoo if needed), and loads **recent recommendations and notes** from the DB.
- An **AI** (OpenAI, Anthropic, or Google – configurable) gets that context and returns a written recommendation. The **full output** is saved in the DB; the UI shows the latest run and history.
- **Memory is in the DB** on purpose: when you deploy new code, the container is replaced but Postgres keeps your data, so the app “remembers” past advice and your inputs.

## Stack

- **Backend:** Node.js (Express), PostgreSQL (Drizzle), Finnhub + Alpha Vantage + optional Yahoo .ST for Swedish stocks
- **Frontend:** Svelte (Vite)
- **Automation:** [Task](https://taskfile.dev/) at repo root for install, dev, build, Docker, and deploy

## Prerequisites

- Node.js 20+
- Docker & Docker Compose (for DB and app)
- [Task](https://taskfile.dev/installation/) (optional but recommended for running commands from root)

## Quick start

1. **Install dependencies**
   ```bash
   task install
   ```

2. **Configure env**
   - Copy the root **`.env.example`** to **`.env`** in the repo root. Backend and frontend both use this single file.
   - **To try the app without API keys:** you can leave `FINNHUB_API_KEY`, `ALPHA_VANTAGE_API_KEY`, and AI keys empty. The app will run; watchlist and notes work; recommendations will show a message to configure keys. `DATABASE_URL` defaults to `postgresql://stonks:stonks@localhost:5432/stonksgpt` if unset (use `task run` so Postgres is up).
   - **For full recommendations:** set `DATABASE_URL` (if not using default), `FINNHUB_API_KEY`, `ALPHA_VANTAGE_API_KEY`, and one of `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `GOOGLE_GENERATIVE_AI_API_KEY` with `AI_PROVIDER`. Optionally `VITE_API_URL` (default `http://localhost:3000`).

3. **Start the project** (DB, migrations, then app – first time or any time)
   ```bash
   task run
   ```
   This starts Postgres, waits for it, runs DB migrations, then starts the backend app. No need to run `docker:up` or `db:migrate` separately.

4. **Run in dev** (no Docker for the app – backend and frontend run locally via concurrently)
   ```bash
   task dev
   ```
   - Backend: http://localhost:3000  
   - Frontend: http://localhost:5173  
   - Ensure Postgres is running first (e.g. `docker compose up -d db` once, then `task db:migrate` if needed).

## Tasks (from root)

All workflows use Task so you don’t have to remember backend vs frontend paths:

| Task | Description |
|------|-------------|
| `task install` | Install deps in root, backend, frontend (npm install) |
| `task ci` | CI pipeline: npm ci in backend + frontend, then build |
| `task dev` | Run backend + frontend in dev (concurrently; no Docker) |
| `task dev:backend` | Run backend only |
| `task dev:frontend` | Run frontend only |
| `task run` | Start full stack in Docker: DB, migrations, then app |
| `task build` | Build backend + frontend for production |
| `task docker:up` | Start Docker (db + app) |
| `task docker:down` | Stop Docker |
| `task docker:build` | Build Docker images |
| `task db:migrate` | Run DB migrations |
| `task deploy` | Build + build images (customize for your server) |

## Documentation

Detailed design and onboarding material lives in **`/docs`**:

- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** – Architecture diagram, data model, core flows, project layout, Task, Docker
- **[docs/DATA_SOURCES.md](docs/DATA_SOURCES.md)** – Market data (Finnhub, Alpha Vantage, Swedish fallback), news, API limits
- **[docs/AI_AND_MCP.md](docs/AI_AND_MCP.md)** – MCP vs universal AI, provider abstraction (OpenAI/Anthropic/Google)
- **[docs/FUTURE.md](docs/FUTURE.md)** – Future ideas (our own MCP, more news, backup, etc.)

## Running without API keys

You can run the app with no Finnhub, Alpha Vantage, or AI keys. The server starts, and you can use the watchlist and manual notes. The daily job and “latest recommendation” will return a placeholder message asking you to configure keys. Use **`GET /api/status`** to see `hasMarketDataKeys`, `hasAiKey`, and `canRunRecommendations`.

## API limits (free tier)

- **Finnhub (US):** 50 symbols, 60 calls/min  
- **Alpha Vantage (ex-US):** 25 calls/day, 5 calls/min  
- **Swedish fallback:** Yahoo Finance .ST via `yahoo-finance2` (unofficial, free)

Limits are enforced in the app; see `backend/src/config/apiLimits.ts`.

## Disclaimer

Recommendations are for informational purposes only, not financial advice.
