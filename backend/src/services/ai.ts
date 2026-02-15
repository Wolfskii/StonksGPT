import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { env } from "../config/env.js";

function getModel() {
  const provider = env.AI_PROVIDER;
  const modelId = env.AI_MODEL;

  if (provider === "openai" && env.OPENAI_API_KEY?.trim()) {
    const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY });
    return openai(modelId);
  }
  if (provider === "anthropic" && env.ANTHROPIC_API_KEY?.trim()) {
    const anthropic = createAnthropic({ apiKey: env.ANTHROPIC_API_KEY });
    return anthropic(modelId);
  }
  if (provider === "google" && env.GOOGLE_GENERATIVE_AI_API_KEY?.trim()) {
    const google = createGoogleGenerativeAI({ apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY });
    return google(modelId);
  }
  // fallback to OpenAI if key present
  if (env.OPENAI_API_KEY?.trim()) {
    const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY });
    return openai(modelId);
  }
  throw new Error("No AI provider key configured. Set OPENAI_API_KEY, ANTHROPIC_API_KEY, or GOOGLE_GENERATIVE_AI_API_KEY.");
}

export async function generateRecommendation(prompt: string): Promise<string> {
  const model = getModel();
  const { text } = await generateText({
    model,
    prompt,
    maxTokens: 4096,
  });
  return text;
}
