import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load root .env (repo root) so one file serves backend + frontend
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const raw = {
  DATABASE_URL: process.env.DATABASE_URL ?? "postgresql://stonks:stonks@localhost:5432/stonksgpt",
  FINNHUB_API_KEY: process.env.FINNHUB_API_KEY ?? "",
  ALPHA_VANTAGE_API_KEY: process.env.ALPHA_VANTAGE_API_KEY ?? "",
  AI_PROVIDER: (process.env.AI_PROVIDER ?? "openai") as "openai" | "anthropic" | "google",
  AI_MODEL: process.env.AI_MODEL ?? "gpt-4o",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? "",
  GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? "",
  PORT: parseInt(process.env.PORT ?? "3000", 10),
};

export const env = raw;

/** True if any market data API key is set (for fetching quotes/news). */
export function hasMarketDataKeys(): boolean {
  return Boolean(raw.FINNHUB_API_KEY?.trim() || raw.ALPHA_VANTAGE_API_KEY?.trim());
}

/** True if an AI provider key is set (for generating recommendations). */
export function hasAiKey(): boolean {
  return Boolean(
    raw.OPENAI_API_KEY?.trim() ||
      raw.ANTHROPIC_API_KEY?.trim() ||
      raw.GOOGLE_GENERATIVE_AI_API_KEY?.trim()
  );
}

/** True if recommendations can be run (market data + AI). */
export function canRunRecommendations(): boolean {
  return hasMarketDataKeys() && hasAiKey();
}
