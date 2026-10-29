import type { Provider, ProviderName } from "./types";

export const PROVIDERS: Record<ProviderName, Provider> = {
  groq: {
    name: "groq",
    baseUrl: "https://api.groq.com/openai/v1",
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_CHAT_MODEL,
  },
  gemini: {
    name: "gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL,
  },
};
