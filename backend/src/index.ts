import express from "express";
import cors from "cors";
import { env, hasMarketDataKeys, hasAiKey, canRunRecommendations } from "./config/env.js";
import { db } from "./db/index.js";
import { dailyRuns, recommendations, manualNotes, watchlist } from "./db/schema.js";
import { desc, eq } from "drizzle-orm";
import { runDailyJob } from "./jobs/dailyJob.js";
import { toErrorMessage } from "./lib/errors.js";
import { getSuggestedMarkets } from "./config/suggestedMarkets.js";

const app = express();
app.use(cors());
app.use(express.json());

/** Config status: whether API keys are set (app works without them; recommendations need them). */
app.get("/api/status", (_req, res) => {
  res.json({
    hasMarketDataKeys: hasMarketDataKeys(),
    hasAiKey: hasAiKey(),
    canRunRecommendations: canRunRecommendations(),
  });
});

/** List suggested markets/funds (S&P 500, World, Europe, Sweden, etc.) for one-click add. */
app.get("/api/suggested-markets", (_req, res) => {
  res.json(getSuggestedMarkets());
});

/** List watchlist symbols. */
app.get("/api/watchlist", async (_req, res) => {
  try {
    const rows = await db.select().from(watchlist).orderBy(desc(watchlist.createdAt));
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: toErrorMessage(e) });
  }
});

/** Add a watchlist symbol. */
app.post("/api/watchlist", async (req, res) => {
  try {
    const { symbol, type, exchange } = req.body ?? {};
    const [row] = await db
      .insert(watchlist)
      .values({
        symbol: String(symbol ?? "").trim() || "?",
        type: type === "etf" || type === "fund" ? type : "stock",
        exchange: exchange ? String(exchange).trim() : null,
      })
      .returning();
    res.status(201).json(row);
  } catch (e) {
    res.status(500).json({ error: toErrorMessage(e) });
  }
});

/** List manual notes. */
app.get("/api/notes", async (_req, res) => {
  try {
    const rows = await db.select().from(manualNotes).orderBy(desc(manualNotes.createdAt));
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: toErrorMessage(e) });
  }
});

/** Add a manual note. */
app.post("/api/notes", async (req, res) => {
  try {
    const { content, noteDate } = req.body ?? {};
    const [row] = await db
      .insert(manualNotes)
      .values({
        content: String(content ?? "").trim() || "(empty)",
        noteDate: noteDate ? new Date(noteDate) : null,
      })
      .returning();
    res.status(201).json(row);
  } catch (e) {
    res.status(500).json({ error: toErrorMessage(e) });
  }
});

/** Get recommendation by run ID (for history view). */
app.get("/api/recommendations", async (req, res) => {
  try {
    const runId = req.query.runId ? parseInt(String(req.query.runId), 10) : NaN;
    if (!Number.isFinite(runId)) return res.status(400).json({ error: "runId required" });
    const [rec] = await db
      .select()
      .from(recommendations)
      .where(eq(recommendations.runId, runId))
      .limit(1);
    if (!rec) return res.status(404).json({ error: "Not found" });
    return res.json(rec);
  } catch (e) {
    res.status(500).json({ error: toErrorMessage(e) });
  }
});

/** Latest recommendation (or placeholder when no keys / no run yet). */
app.get("/api/recommendations/latest", async (_req, res) => {
  try {
    const rec = await db
      .select()
      .from(recommendations)
      .orderBy(desc(recommendations.createdAt))
      .limit(1)
      .then((r) => r[0]);
    if (rec) return res.json(rec);

    if (!canRunRecommendations()) {
      return res.json({
        id: 0,
        runId: 0,
        fullOutput:
          "Configure API keys in .env to get recommendations: FINNHUB_API_KEY, ALPHA_VANTAGE_API_KEY, and one of OPENAI_API_KEY / ANTHROPIC_API_KEY / GOOGLE_GENERATIVE_AI_API_KEY. You can still use the watchlist and notes.",
        structuredSummary: null,
        createdAt: new Date().toISOString(),
      });
    }
    res.json(null);
  } catch (e) {
    res.status(500).json({ error: toErrorMessage(e) });
  }
});

/** List recent daily runs. */
app.get("/api/runs", async (_req, res) => {
  try {
    const rows = await db.select().from(dailyRuns).orderBy(desc(dailyRuns.createdAt)).limit(50);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: toErrorMessage(e) });
  }
});

/** Trigger daily job. Without API keys we store a placeholder run + recommendation. */
app.post("/api/jobs/daily", async (_req, res) => {
  try {
    if (!canRunRecommendations()) {
      const [run] = await db
        .insert(dailyRuns)
        .values({
          status: "success",
          inputSnapshot: { symbols: [], date: new Date().toISOString().slice(0, 10) },
        })
        .returning();
      if (run) {
        await db.insert(recommendations).values({
          runId: run.id,
          fullOutput:
            "No API keys configured. Add FINNHUB_API_KEY, ALPHA_VANTAGE_API_KEY, and an AI provider key (OPENAI_API_KEY, ANTHROPIC_API_KEY, or GOOGLE_GENERATIVE_AI_API_KEY) to .env to get real recommendations. You can still use the app to manage your watchlist and notes.",
          structuredSummary: null,
        });
      }
      return res.json({ ok: true, message: "Placeholder saved; configure API keys for real recommendations." });
    }

    const result = await runDailyJob();
    return res.json(result);
  } catch (e) {
    res.status(500).json({ ok: false, error: toErrorMessage(e) });
  }
});

app.listen(env.PORT, () => {
  console.log(`Server at http://localhost:${env.PORT}`);
  if (!canRunRecommendations()) {
    console.log("(API keys not set – app runs; configure keys for recommendations)");
  }
});
