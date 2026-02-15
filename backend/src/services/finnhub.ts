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

export type FinnhubSearchResult = {
  symbol: string;
  displaySymbol: string;
  description: string;
  type: string;
};

export async function searchFinnhubSymbols(q: string): Promise<FinnhubSearchResult[]> {
  if (!env.FINNHUB_API_KEY?.trim()) return [];
  const query = String(q).trim();
  if (!query || query.length < 2) return [];

  const result = await queue.add(async (): Promise<FinnhubSearchResult[]> => {
    const url = `${BASE}/search?q=${encodeURIComponent(query)}&token=${env.FINNHUB_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = (await res.json()) as { count?: number; result?: Array<Record<string, unknown>> };
    const list = data.result ?? [];
    return list.slice(0, 8).map((r) => ({
      symbol: String(r.symbol ?? r.displaySymbol ?? ""),
      displaySymbol: String(r.displaySymbol ?? r.symbol ?? ""),
      description: String(r.description ?? ""),
      type: String(r.type ?? ""),
    }));
  });
  return result ?? [];
}

export type FinnhubNewsItem = {
  title: string;
  url?: string;
  source?: string;
  snippet?: string;
};

/** General market news (category=general). Returns up to 5 items. Prefer getCompanyNews for relevance. */
export async function getMarketNews(): Promise<FinnhubNewsItem[]> {
  if (!env.FINNHUB_API_KEY?.trim()) return [];
  const result = await queue.add(async (): Promise<FinnhubNewsItem[]> => {
    const url = `${BASE}/news?category=general&token=${env.FINNHUB_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = (await res.json()) as Array<Record<string, unknown>>;
    if (!Array.isArray(data)) return [];
    return data.slice(0, 5).map((item) => ({
      title: String(item.headline ?? ""),
      url: item.url != null ? String(item.url) : undefined,
      source: item.source != null ? String(item.source) : undefined,
      snippet: item.summary != null ? String(item.summary).slice(0, 200) : undefined,
    }));
  });
  return result ?? [];
}

export type FinnhubCompanyNewsItem = FinnhubNewsItem & { symbol?: string; displayName?: string };

/** Company-specific news for a symbol. from/to in YYYY-MM-DD. Returns up to maxItems (default 2). */
export async function getCompanyNews(
  symbol: string,
  from: string,
  to: string,
  maxItems = 2
): Promise<FinnhubCompanyNewsItem[]> {
  if (!env.FINNHUB_API_KEY?.trim()) return [];
  const sym = String(symbol).trim().toUpperCase();
  if (!sym) return [];
  const result = await queue.add(async (): Promise<FinnhubCompanyNewsItem[]> => {
    const url = `${BASE}/company-news?symbol=${encodeURIComponent(sym)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&token=${env.FINNHUB_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = (await res.json()) as Array<Record<string, unknown>>;
    if (!Array.isArray(data)) return [];
    return data.slice(0, maxItems).map((item) => ({
      title: String(item.headline ?? ""),
      url: item.url != null ? String(item.url) : undefined,
      source: item.source != null ? String(item.source) : undefined,
      snippet: item.summary != null ? String(item.summary).slice(0, 200) : undefined,
    }));
  });
  return result ?? [];
}
