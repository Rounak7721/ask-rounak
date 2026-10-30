import type { ChatMessage, Provider } from "./types";

export async function chatCompletion(
  provider: Provider,
  system: string,
  messages: ChatMessage[],
): Promise<string> {
  if (!provider.apiKey || !provider.model) {
    throw new Error(`${provider.name}: missing API key or model`);
  }

  const res = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: provider.model,
      messages: [{ role: "system", content: system }, ...messages],
      reasoning_effort: "low",
      temperature: 0.4,
      // Safety net against runaway replies (counts reasoning tokens too); normal replies use < 300.
      max_completion_tokens: 1200,
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    throw new Error(`${provider.name}: HTTP ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const reply = data.choices?.[0]?.message?.content?.trim();
  if (!reply) throw new Error(`${provider.name}: empty reply`);
  return reply;
}
