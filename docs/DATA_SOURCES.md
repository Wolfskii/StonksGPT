# Data sources

## Market data – hybrid: Finnhub (US) + Alpha Vantage (ex-US)

Finnhub has a better **US** free tier (60 calls/min, 50 symbols, real-time). Alpha Vantage has **global** coverage (Europe, Asia, etc.) but stricter limits (25/day, 5/min) and no free real-time US. We use both and route by market:

- **US symbols** → **Finnhub** (60/min, 50 symbols max, real-time). Enforced in app via `backend/src/config/apiLimits.ts`.
- **Ex-US symbols** (Europe, UK, Germany, Canada, India, China, etc.) → **Alpha Vantage** (25 req/day, 5/min). Rate limiter + daily cap in Alpha Vantage client.
- **Sweden (.ST / XSTO):** Try Alpha Vantage first; if missing, use the Swedish fallback below.

**Market-data router:** For each watchlist symbol, the backend decides: US (no exchange suffix or known US list) → Finnhub; ex-US (e.g. .LON, .DEX, .TRT, .ST) → Alpha Vantage (or Swedish fallback for .ST if Alpha doesn’t have Stockholm). The watchlist can total more than 25 symbols as long as the ex-US subset stays within Alpha’s 25 req/day (cap or batch).

**Limits in app:**

- Finnhub: `FINNHUB_MAX_SYMBOLS = 50`, `FINNHUB_MAX_CALLS_PER_MINUTE = 60`.
- Alpha Vantage: `ALPHA_VANTAGE_MAX_REQUESTS_PER_DAY = 25`, `ALPHA_VANTAGE_MAX_REQUESTS_PER_MINUTE = 5`.

**Endpoints:**

- **Alpha Vantage (ex-US):** GLOBAL_QUOTE, TIME_SERIES_DAILY (compact), NEWS_SENTIMENT.
- **Finnhub (US):** quote and market-news endpoints.

## Swedish stocks fallback

If Alpha Vantage doesn’t cover Nasdaq Stockholm (.ST / XSTO):

- **Free fallback:** Yahoo Finance .ST tickers (e.g. `ABB.ST`) via Node library `yahoo-finance2`. Unofficial, no cost. Use only for Swedish symbols; respect rate limits and ToS.
- **Paid option:** e.g. Twelve Data (XSTO; paid from ~$29/mo). Config e.g. `SWEDEN_PROVIDER=twelvedata`; call only for .ST / XSTO symbols.

Router: US → Finnhub; ex-US → Alpha Vantage; .ST / Swedish → Alpha Vantage if available, else Swedish fallback. Swedish fallback does not consume Finnhub or Alpha quota.

## News

- **Alpha Vantage NEWS_SENTIMENT** – market/finance news and sentiment (especially ex-US).
- **Finnhub market news** – US.
- **Manual context** – user-entered notes in the app (stored in DB) are injected into the daily prompt (e.g. “WW3 risk”, “RAM shortage / AI capex”).
