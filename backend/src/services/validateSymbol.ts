import { getFinnhubQuote } from "./finnhub.js";
import { getAlphaVantageQuote } from "./alphaVantage.js";
import { searchFinnhubSymbols } from "./finnhub.js";

export type ValidateResult =
  | { valid: true }
  | { valid: false; suggestions: Array<{ symbol: string; description: string }> };

/**
 * Check if a symbol can be resolved (quote exists). If not, return suggestions from symbol search.
 */
export async function validateSymbol(
  symbol: string,
  exchange: string | null
): Promise<ValidateResult> {
  const clean = String(symbol).trim();
  if (!clean) return { valid: false, suggestions: [] };

  const isLikelyUs = !clean.includes(".") || exchange?.toUpperCase() === "US";

  // Try quote: US-style first via Finnhub, then Alpha Vantage
  if (isLikelyUs) {
    const q = await getFinnhubQuote(clean);
    if (q != null) return { valid: true };
  }
  const qAlpha = await getAlphaVantageQuote(clean);
  if (qAlpha != null) return { valid: true };

  if (!isLikelyUs) {
    const qFinn = await getFinnhubQuote(clean);
    if (qFinn != null) return { valid: true };
  }

  // No quote found – get suggestions from Finnhub search
  const searchResults = await searchFinnhubSymbols(clean);
  const suggestions = searchResults.map((r) => ({
    symbol: r.symbol || r.displaySymbol,
    description: r.description || r.type || "",
  }));

  return { valid: false, suggestions };
}
