import { LLM } from "@/lib/config";
import type { CallInfo, ChatMessage, Target } from "./types";

// A failed call that still carries the rate-limit info from its headers (a 429 says when to retry).
export class LLMError extends Error {
  constructor(
    message: string,
    public info: CallInfo,
  ) {
    super(message);
  }
}

// Groq durations look like "54ms", "7.66s" or "1m2.5s".
function durationMs(value: string | null): number | undefined {
  if (!value) return undefined;
  const unit: Record<string, number> = { ms: 1, s: 1000, m: 60_000, h: 3_600_000 };
  let total = 0;
  for (const [, n, u] of value.matchAll(/([\d.]+)(ms|s|m|h)/g)) total += parseFloat(n) * unit[u];
  return total || undefined;
}

const num = (value: string | null) => (value === null || value === "" ? undefined : Number(value));

function readInfo(res: Response, usage?: { prompt_tokens?: number; prompt_tokens_details?: { cached_tokens?: number } }): CallInfo {
  const retryAfter = num(res.headers.get("retry-after"));
  return {
    promptTokens: usage?.prompt_tokens,
    cachedTokens: usage?.prompt_tokens_details?.cached_tokens,
    remainingTokens: num(res.headers.get("x-ratelimit-remaining-tokens")),
    resetTokensMs: durationMs(res.headers.get("x-ratelimit-reset-tokens")),
    retryAfterMs: retryAfter === undefined ? undefined : retryAfter * 1000,
  };
}

export async function chatCompletion(
  target: Target,
  system: string,
  messages: ChatMessage[],
): Promise<{ reply: string; info: CallInfo }> {
  if (!target.apiKey || !target.model) {
    throw new Error(`${target.id}: missing API key or model`);
  }

  const res = await fetch(`${target.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${target.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: target.model,
      messages: [{ role: "system", content: system }, ...messages],
      reasoning_effort: LLM.reasoningEffort,
      temperature: LLM.temperature,
      max_completion_tokens: LLM.maxCompletionTokens,
    }),
    signal: AbortSignal.timeout(LLM.timeoutMs),
  });

  if (!res.ok) {
    throw new LLMError(`${target.id}: HTTP ${res.status} ${await res.text()}`, readInfo(res));
  }

  const data = await res.json();
  const info = readInfo(res, data.usage);
  const reply = data.choices?.[0]?.message?.content?.trim();
  if (!reply) throw new LLMError(`${target.id}: empty reply`, info);
  return { reply, info };
}
