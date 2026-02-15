import { env } from "../config/env.js";
import {
  ALPHA_VANTAGE_MAX_REQUESTS_PER_DAY,
  ALPHA_VANTAGE_MAX_REQUESTS_PER_MINUTE,
  EX_US_SYMBOLS_CAP,
} from "../config/apiLimits.js";
import PQueue from "p-queue";

const BASE = "https://www.alphavantage.co/query";

let dailyRequestCount = 0;
let lastDailyReset = Date.now();

function maybeResetDaily(): void {
  const now = Date.now();
  if (now - lastDailyReset > 24 * 60 * 60 * 1000) {
    dailyRequestCount = 0;
    lastDailyReset = now;
  }
}

const perMinuteQueue = new PQueue({
  intervalCap: ALPHA_VANTAGE_MAX_REQUESTS_PER_MINUTE,
  interval: 60_000,
});

export type AlphaQuote = {
  symbol: string;
  price: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  previousClose: number;
  change: number;
  changePercent: string;
};

export async function getAlphaVantageQuote(symbol: string): Promise<AlphaQuote | null> {
  if (!env.ALPHA_VANTAGE_API_KEY?.trim()) return null;
  const clean = String(symbol).trim();
  if (!clean) return null;

  maybeResetDaily();
  if (dailyRequestCount >= ALPHA_VANTAGE_MAX_REQUESTS_PER_DAY) return null;

  const result = await perMinuteQueue.add(async (): Promise<AlphaQuote | null> => {
    dailyRequestCount++;
    const url = `${BASE}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(clean)}&apikey=${env.ALPHA_VANTAGE_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as { "Global Quote"?: Record<string, string> };
    const q = data["Global Quote"];
    if (!q?.["05. price"]) return null;
    return {
      symbol: q["01. symbol"] ?? clean,
      price: parseFloat(q["05. price"]),
      open: parseFloat(q["02. open"] ?? "0"),
      high: parseFloat(q["03. high"] ?? "0"),
      low: parseFloat(q["04. low"] ?? "0"),
      volume: parseInt(q["06. volume"] ?? "0", 10),
      previousClose: parseFloat(q["08. previous close"] ?? "0"),
      change: parseFloat(q["09. change"] ?? "0"),
      changePercent: q["10. change percent"] ?? "0%",
    };
  });
  return result ?? null;
}

export function getAlphaVantageMaxSymbols(): number {
  return EX_US_SYMBOLS_CAP;
}
