/**
 * Suggested broad markets/funds (Avanza-style) for recommendations.
 * All use US-listed symbols so Finnhub can fetch quotes; AI can recommend buy/sell even with empty watchlist.
 */

export type SuggestedMarket = {
  id: string;
  name: string;
  symbol: string;
  type: "etf" | "fund";
  exchange: string | null;
};

export const SUGGESTED_MARKETS: SuggestedMarket[] = [
  { id: "sp500", name: "S&P 500", symbol: "SPY", type: "etf", exchange: "US" },
  { id: "us_total", name: "US Total Market", symbol: "VTI", type: "etf", exchange: "US" },
  { id: "world", name: "World", symbol: "VT", type: "etf", exchange: "US" },
  { id: "europe", name: "Europe", symbol: "VGK", type: "etf", exchange: "US" },
  { id: "sweden", name: "Sweden", symbol: "EWM", type: "etf", exchange: "US" },
  { id: "developed", name: "Developed (ex-US)", symbol: "VEA", type: "etf", exchange: "US" },
  { id: "emerging", name: "Emerging Markets", symbol: "VWO", type: "etf", exchange: "US" },
];

const BY_SYMBOL = new Map(SUGGESTED_MARKETS.map((m) => [m.symbol.toUpperCase(), m]));

export function getSuggestedMarkets(): SuggestedMarket[] {
  return [...SUGGESTED_MARKETS];
}

export function getSuggestedBySymbol(symbol: string): SuggestedMarket | undefined {
  return BY_SYMBOL.get(String(symbol).trim().toUpperCase());
}

/** Symbols to always include in daily job context (for recommendations when watchlist is empty or small). */
export function getSuggestedSymbolsForJob(): Array<{ symbol: string; exchange: string | null }> {
  return SUGGESTED_MARKETS.map((m) => ({ symbol: m.symbol, exchange: m.exchange }));
}
