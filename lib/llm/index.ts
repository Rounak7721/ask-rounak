import { LLM } from "@/lib/config";
import { SYSTEM_PROMPT } from "@/lib/persona";
import { chatCompletion, LLMError } from "./openaiCompatible";
import { TARGETS } from "./providers";
import type { CallInfo, ChatMessage, LLMResult } from "./types";

// Remembered rate-limit state per target, from the headers of the last call.
// It lives in memory, so it's per server instance: best effort, with the 429 fallback as the safety net.
const state = new Map<string, { remaining?: number; resetAt?: number; blockedUntil?: number }>();

// Rough token estimate from characters, plus the reply allowance.
const estimate = (messages: ChatMessage[]) =>
  Math.ceil((SYSTEM_PROMPT.length + messages.reduce((n, m) => n + m.content.length, 0)) / LLM.charsPerToken) +
  LLM.replyAllowanceTokens;

function remember(id: string, info: CallInfo) {
  const now = Date.now();
  const s = state.get(id) ?? {};
  if (info.remainingTokens !== undefined) s.remaining = info.remainingTokens;
  if (info.resetTokensMs !== undefined) s.resetAt = now + info.resetTokensMs;
  if (info.retryAfterMs !== undefined) s.blockedUntil = now + info.retryAfterMs;
  state.set(id, s);
}

// Skip a target we already know can't take this request, instead of waiting for a 429.
function looksFull(id: string, need: number): boolean {
  const s = state.get(id);
  if (!s) return false;
  const now = Date.now();
  if (s.blockedUntil && now < s.blockedUntil) return true;
  if (s.resetAt && now >= s.resetAt) return false; // the bucket has refilled since
  return s.remaining !== undefined && s.remaining < need;
}

export async function chatWithFallback(messages: ChatMessage[]): Promise<LLMResult> {
  const need = estimate(messages);
  const order = [...TARGETS.filter((t) => !looksFull(t.id, need)), ...TARGETS.filter((t) => looksFull(t.id, need))];

  for (const target of order) {
    try {
      const { reply, info } = await chatCompletion(target, SYSTEM_PROMPT, messages);
      remember(target.id, info);
      console.info(
        `LLM ${target.id}: prompt ${info.promptTokens ?? "?"} tokens, cached ${info.cachedTokens ?? 0}, remaining ${info.remainingTokens ?? "?"}`,
      );
      return { reply, provider: target.id };
    } catch (err) {
      if (err instanceof LLMError) remember(target.id, err.info);
      console.error(`LLM ${target.id} failed:`, err instanceof Error ? err.message : err);
    }
  }
  throw new Error("All LLM providers failed");
}
