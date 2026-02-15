import {
  FINNHUB_MAX_SYMBOLS,
  EX_US_SYMBOLS_CAP,
} from "../config/apiLimits.js";
import { getFinnhubQuote } from "./finnhub.js";
import { getAlphaVantageQuote } from "./alphaVantage.js";
import { env } from "../config/env.js";

/** US symbols: no exchange suffix, or exchange is US. Ex-US: .LON, .DEX, .ST, .TRT, etc. */
function isUsSymbol(symbol: string, exchange: string | null): boolean {
  const s = String(symbol).trim().toUpperCase();
  if (exchange?.toUpperCase() === "US") return true;
  if (/\.(LON|DEX|TRT|TRV|BSE|SHH|SHZ|ST)$/i.test(s)) return false;
  if (!s.includes(".")) return true; // no dot => assume US for simplicity
  return false;
}

export type QuoteSummary = {
  symbol: string;
  source: "finnhub" | "alphavantage";
  price: number;
  change?: number;
  changePercent?: string;
  raw?: unknown;
};

export async function getQuotes(
  symbols: Array<{ symbol: string; exchange: string | null }>
): Promise<QuoteSummary[]> {
  const us: Array<{ symbol: string; exchange: string | null }> = [];
  const exUs: Array<{ symbol: string; exchange: string | null }> = [];

  for (const row of symbols) {
    if (isUsSymbol(row.symbol, row.exchange)) us.push(row);
    else exUs.push(row);
  }

  const usCapped = us.slice(0, FINNHUB_MAX_SYMBOLS);
  const exUsCapped = exUs.slice(0, EX_US_SYMBOLS_CAP);

  const results: QuoteSummary[] = [];

  if (env.FINNHUB_API_KEY?.trim()) {
    for (const { symbol } of usCapped) {
      const q = await getFinnhubQuote(symbol);
      if (q) results.push({ symbol: q.symbol, source: "finnhub", price: q.c, change: q.d, changePercent: String(q.dp ?? ""), raw: q });
    }
  }

  if (env.ALPHA_VANTAGE_API_KEY?.trim()) {
    for (const { symbol } of exUsCapped) {
      const q = await getAlphaVantageQuote(symbol);
      if (q) results.push({ symbol: q.symbol, source: "alphavantage", price: q.price, change: q.change, changePercent: q.changePercent, raw: q });
    }
  }

  return results;
}
