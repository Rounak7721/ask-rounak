import { chatWithFallback } from "@/lib/llm";
import type { ChatMessage } from "@/lib/llm/types";
import { after } from "next/server";
import { INPUT_MODES, logQA, type InputMode } from "@/lib/log";
import { rateLimited } from "@/lib/rateLimit";

export async function POST(req: Request) {
  const wait = rateLimited(req, "chat", 30);
  if (wait) return Response.json({ error: "Too many requests", retryAfter: wait }, { status: 429 });
  const body = await req.json().catch(() => null);
  const messages = body?.messages;

  if (
    !Array.isArray(messages) ||
    messages.length === 0 ||
    !messages.every(
      (m) =>
        (m?.role === "user" || m?.role === "assistant") &&
        typeof m.content === "string",
    )
  ) {
    return Response.json({ error: "Invalid messages" }, { status: 400 });
  }
  // Clip instead of rejecting, so one long reply in the history can't break every later request.
  const history: ChatMessage[] = messages.slice(-10).map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
  const sessionId = typeof body?.sessionId === "string" ? body.sessionId.slice(0, 64) : "unknown";
  const inputMode: InputMode | undefined = INPUT_MODES.includes(body?.inputMode) ? body.inputMode : undefined;

  try {
    const { reply, provider } = await chatWithFallback(history);
    after(() =>
      logQA({ sessionId, inputMode, provider, question: history[history.length - 1].content, answer: reply }),
    );
    return Response.json({ reply, provider });
  } catch {
    return Response.json({ error: "LLM request failed" }, { status: 502 });
  }
}
