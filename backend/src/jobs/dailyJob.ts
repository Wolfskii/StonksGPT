import { db } from "../db/index.js";
import { dailyRuns, recommendations, manualNotes, watchlist } from "../db/schema.js";
import { desc, eq } from "drizzle-orm";
import { getQuotes } from "../services/marketDataRouter.js";
import { generateRecommendation } from "../services/ai.js";
import { getCompanyNews } from "../services/finnhub.js";
import { getYahooFinanceNews, getDagensIndustriNews } from "../services/yahooAndDiNews.js";
import {
  getSuggestedMarkets,
  getSuggestedSymbolsForJob,
} from "../config/suggestedMarkets.js";
import { FINNHUB_MAX_SYMBOLS } from "../config/apiLimits.js";

const RECENT_RECOMMENDATIONS_LIMIT = 3;
const RECENT_NOTES_LIMIT = 10;

const RISK_DESCRIPTIONS: Record<number, string> = {
  1: "Very conservative – capital preservation, minimal volatility",
  2: "Conservative – low risk, some growth",
  3: "Moderate – balanced risk and return",
  4: "Growth – higher risk for higher long-term return",
  5: "Aggressive – highest risk tolerance, maximum growth focus",
};

export async function runDailyJob(riskLevel?: number): Promise<{ ok: true } | { ok: false; error: string }> {
  const dateStr = new Date().toISOString().slice(0, 10);
  const risk = riskLevel != null && riskLevel >= 1 && riskLevel <= 5 ? riskLevel : 3;

  const [run] = await db
    .insert(dailyRuns)
    .values({ status: "running", inputSnapshot: { symbols: [], date: dateStr, riskLevel: risk } })
    .returning();

  if (!run) return { ok: false, error: "Failed to create run" };

  try {
    const watchlistRows = await db.select().from(watchlist).orderBy(desc(watchlist.createdAt));
    const watchlistSymbols = watchlistRows.map((r) => ({
      symbol: r.symbol,
      exchange: r.exchange,
      displayName: r.displayName ?? undefined,
    }));
    const suggestedSymbols = getSuggestedSymbolsForJob();
    const seen = new Set<string>();
    const symbolsForQuotes: Array<{ symbol: string; exchange: string | null }> = [];
    for (const w of watchlistSymbols) {
      const key = w.symbol.toUpperCase();
      if (!seen.has(key)) {
        seen.add(key);
        symbolsForQuotes.push({ symbol: w.symbol, exchange: w.exchange });
      }
    }
    for (const s of suggestedSymbols) {
      const key = s.symbol.toUpperCase();
      if (!seen.has(key) && symbolsForQuotes.length < FINNHUB_MAX_SYMBOLS) {
        seen.add(key);
        symbolsForQuotes.push(s);
      }
    }

    const quotes = await getQuotes(symbolsForQuotes);
    const quoteMap = new Map(quotes.map((q) => [q.symbol.toUpperCase(), q]));
    const suggestedMarkets = getSuggestedMarkets();

    // Company-specific news for watchlist symbols only (relevant to user's symbols and their market)
    const toDate = new Date();
    const fromDate = new Date(toDate);
    fromDate.setDate(fromDate.getDate() - 7);
    const fromStr = fromDate.toISOString().slice(0, 10);
    const toStr = toDate.toISOString().slice(0, 10);
    const newsItems: Array<{
      title: string;
      url?: string;
      source?: string;
      snippet?: string;
      symbol?: string;
      displayName?: string;
    }> = [];
    for (const w of watchlistSymbols) {
      try {
        const items = await getCompanyNews(w.symbol, fromStr, toStr, 2);
        for (const item of items) {
          newsItems.push({
            ...item,
            symbol: w.symbol,
            displayName: w.displayName,
          });
        }
      } catch {
        // Skip this symbol's news on failure
      }
    }

    try {
      const yahooItems = await getYahooFinanceNews(watchlistSymbols, 12);
      for (const item of yahooItems) {
        newsItems.push({ ...item });
      }
    } catch {
      // Non-fatal
    }

    try {
      const diItems = await getDagensIndustriNews(6);
      for (const item of diItems) {
        newsItems.push({ ...item });
      }
    } catch {
      // Non-fatal
    }

    const watchlistLines =
      watchlistSymbols.length > 0
        ? watchlistSymbols
            .map(
              (w) =>
                `${w.symbol}${w.displayName ? ` (${w.displayName})` : ""}${w.exchange ? `, ${w.exchange}` : ""}`
            )
            .join("; ")
        : "(Watchlist empty)";

    const newsLines =
      newsItems.length > 0
        ? newsItems
            .map((n) => {
              const label =
                n.symbol && (n.displayName || n.symbol)
                  ? `[${n.symbol}${n.displayName ? ` ${n.displayName}` : ""}]: `
                  : "";
              return `- ${label}${n.title}${n.source ? ` (${n.source})` : ""}`;
            })
            .join("\n")
        : "(No news fetched for watchlist symbols, Yahoo Finance, or DI.)";

    const quoteLines =
      quotes.length > 0
        ? quotes
            .map(
              (q) =>
                `- ${q.symbol}: ${q.price}${q.changePercent != null ? ` (${q.changePercent})` : ""} [${q.source}]`
            )
            .join("\n")
        : "(No quotes fetched – add symbols or check API keys)";

    const suggestedLines = suggestedMarkets
      .map((m) => {
        const q = quoteMap.get(m.symbol.toUpperCase());
        return q
          ? `- ${m.name} (${m.symbol}): ${q.price}${q.changePercent != null ? ` (${q.changePercent})` : ""}`
          : `- ${m.name} (${m.symbol}): no quote`;
      })
      .join("\n");

    const recentRecs = await db
      .select({ fullOutput: recommendations.fullOutput })
      .from(recommendations)
      .orderBy(desc(recommendations.createdAt))
      .limit(RECENT_RECOMMENDATIONS_LIMIT);
    const recentRecText =
      recentRecs.length > 0
        ? recentRecs.map((r, i) => `[Previous ${i + 1}]\n${r.fullOutput.slice(0, 800)}...`).join("\n\n")
        : "(No previous recommendations)";

    const recentNotes = await db
      .select({ content: manualNotes.content, noteDate: manualNotes.noteDate })
      .from(manualNotes)
      .orderBy(desc(manualNotes.createdAt))
      .limit(RECENT_NOTES_LIMIT);
    const notesText =
      recentNotes.length > 0
        ? recentNotes.map((n) => `- ${n.noteDate ? n.noteDate.toISOString().slice(0, 10) + ": " : ""}${n.content}`).join("\n")
        : "(No manual notes)";

    const riskDesc = RISK_DESCRIPTIONS[risk] ?? RISK_DESCRIPTIONS[3];
    const prompt = `You are a long-term investing assistant. Focus on multi-year horizons; avoid day-trading or short-term tips.

Today's date: ${dateStr}

User's risk tolerance (1–5, 1=most conservative, 5=most aggressive): ${risk}. ${riskDesc}. Tailor your recommendation to this level: at 1–2 prefer stable, diversified index funds and avoid volatile or single-country bets; at 4–5 you may suggest more growth-oriented or regional tilts while still emphasizing long-term diversification.

User watchlist (symbol, full name, market): ${watchlistLines}

Current quotes for symbols considered (user watchlist + suggested broad markets):
${quoteLines}

Suggested broad markets/funds the user can add (Avanza-style). You may recommend buying or selling these even if the user has not added them yet:
${suggestedLines}

Recent recommendation summaries (for context only):
${recentRecText}

User's manual notes (for context):
${notesText}

Recent news: company news for your watchlist symbols, Yahoo Finance headlines for those symbols, and DI (Dagens Industri) Swedish business news. Use for context when relevant:
${newsLines}

Based on the quotes, suggested markets, and news above, provide a concise daily recommendation: which broad markets or symbols to consider buying, holding, or avoiding, and brief reasoning. You can recommend e.g. S&P 500, World, Europe, Sweden, or emerging markets by name. If the user's watchlist is empty, still give recommendations using the suggested markets. Do not add a disclaimer at the end (the app already shows one at the bottom of the page).

IMPORTANT – output in two languages: First write the full recommendation in English. Then on a new line write exactly: ---SWEDISH--- Then write the exact same recommendation in Swedish (Svenska). The app will show one or the other based on the user's language setting.`;

    const rawOutput = await generateRecommendation(prompt);
    const SEP = "---SWEDISH---";
    const sepIndex = rawOutput.indexOf(SEP);
    const fullOutput = sepIndex >= 0 ? rawOutput.slice(0, sepIndex).trim() : rawOutput;
    const fullOutputSv =
      sepIndex >= 0 ? rawOutput.slice(sepIndex + SEP.length).trim() : null;

    await db.insert(recommendations).values({
      runId: run.id,
      fullOutput,
      fullOutputSv: fullOutputSv || null,
      structuredSummary: null,
    });

    await db
      .update(dailyRuns)
      .set({
        status: "success",
        inputSnapshot: {
          symbols: symbolsForQuotes.map((s) => s.symbol),
          date: dateStr,
          riskLevel: risk,
          promptHumanReadable: prompt,
          newsItems,
        },
      })
      .where(eq(dailyRuns.id, run.id));

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db
      .update(dailyRuns)
      .set({
        status: "error",
        inputSnapshot: {
          symbols: [],
          date: dateStr,
          error: message,
          riskLevel: risk,
          promptHumanReadable: undefined,
          newsItems: [],
        },
      })
      .where(eq(dailyRuns.id, run.id));
    return { ok: false, error: message };
  }
}
