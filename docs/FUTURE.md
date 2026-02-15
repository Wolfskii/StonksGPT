# Future plans

Ideas for later; not in the initial scope.

- **Alpha Vantage MCP** – Add their MCP server to Cursor/Claude (remote URL + API key) for ad-hoc market data in the IDE; the app keeps using REST for the daily job.
- **Our own MCP server** – Expose “get watchlist”, “get latest recommendation”, “get note by date” so Cursor/Claude can query StonksGPT data.
- **Sweden / Stockholm** – If Alpha Vantage lacks Nasdaq Stockholm, ensure the Swedish fallback (e.g. Yahoo .ST via `yahoo-finance2`) is enabled and the router uses it for .ST symbols.
- **More news** – Add NewsAPI or MarketAux for broader economy headlines beyond NEWS_SENTIMENT.
- **Backup/export** – Periodic export of `memory/*.md` and DB dump for backup.
