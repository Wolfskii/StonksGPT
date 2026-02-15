import { env } from "../config/env.js";
import {
  FINNHUB_MAX_CALLS_PER_MINUTE,
  FINNHUB_MAX_SYMBOLS,
} from "../config/apiLimits.js";
import PQueue from "p-queue";

const BASE = "https://finnhub.io/api/v1";

const queue = new PQueue({
  intervalCap: FINNHUB_MAX_CALLS_PER_MINUTE,
  interval: 60_000,
});

export type FinnhubQuote = {
  symbol: string;
  c: number; // current
  d: number; // change
  dp: number; // percent change
  h: number;
  l: number;
  o: number;
  pc: number;
  t: number;
};

export async function getFinnhubQuote(symbol: string): Promise<FinnhubQuote | null> {
  if (!env.FINNHUB_API_KEY?.trim()) return null;
  const clean = String(symbol).trim().toUpperCase();
  if (!clean) return null;

  const result = await queue.add(async (): Promise<FinnhubQuote | null> => {
    const url = `${BASE}/quote?symbol=${encodeURIComponent(clean)}&token=${env.FINNHUB_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, unknown>;
    if (data.c == null) return null;
    return { symbol: clean, ...data } as FinnhubQuote;
  });
  return result ?? null;
}

export function getFinnhubMaxSymbols(): number {
  return FINNHUB_MAX_SYMBOLS;
}
