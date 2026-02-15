# AI and MCP

## MCP vs “universal AI”

- **MCP (Model Context Protocol)** exposes data and tools *to* an AI (e.g. Cursor, Claude Desktop). It is **not** for choosing which LLM provider (OpenAI, Anthropic, Gemini) to call.
- **Alpha Vantage** provides an [official MCP server](https://mcp.alphavantage.co/). You can add it to Cursor, Claude, VS Code, etc. to query live market data (quotes, time series, news sentiment, fundamentals) from the AI in your editor. For our **automated** daily job we still call the Alpha Vantage REST API from the backend so we control request count.
- **Universal LLM usage** = one codebase that can call OpenAI, Anthropic, Google Gemini, etc. That requires an **LLM abstraction**, not MCP.

**In this repo:** We use the **Vercel AI SDK** for the app’s “universal” LLM connection. You can optionally add Alpha Vantage’s MCP to your IDE for ad-hoc market data. The StonksGPT app can later expose its own MCP (watchlist, recommendations) so Cursor/Claude can query your data.

## AI provider abstraction

- **Env:** `AI_PROVIDER=openai|anthropic|google`, and the corresponding key: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, or `GOOGLE_GENERATIVE_AI_API_KEY`. Only the active provider’s key is required.
- **Code:** One module maps `AI_PROVIDER` to the correct Vercel AI SDK model (e.g. `gpt-4o`, `claude-sonnet-4`, `gemini-1.5-pro`). All prompts go through `generateText({ model: getModel(), prompt: ... })`.
