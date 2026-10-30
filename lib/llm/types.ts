export type ChatMessage = { role: "user" | "assistant"; content: string };

// One model on one provider, e.g. "groq" (gpt-oss-120b) or "groq-2" (gpt-oss-20b). The id is what gets logged.
export type Target = {
  id: string;
  baseUrl: string;
  apiKey: string | undefined;
  model: string | undefined;
};

// What one call tells us about usage and rate limits. Gemini sends no rate-limit headers, so those stay undefined.
export type CallInfo = {
  promptTokens?: number;
  cachedTokens?: number;
  remainingTokens?: number;
  resetTokensMs?: number;
  retryAfterMs?: number;
};

export type LLMResult = { reply: string; provider: string };
