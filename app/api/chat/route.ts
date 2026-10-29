import { chatWithFallback } from "@/lib/llm";
import type { ChatMessage } from "@/lib/llm/types"
import { after } from "next/server";
import { INPUT_MODES, logQA, type InputMode } from "@/lib/log";

export async function POST(req: Request) {
    const body = await req.json().catch(() => null);
    const messages = body?.messages;

    if (
        !Array.isArray(messages) ||
        messages.length === 0 ||
        !messages.every(
            (m) =>
                (m?.role === "user" || m?.role === "assistant") &&
                typeof m.content === "string" &&
                m.content.length <= 2000,
        )
    ) {
        return Response.json({ error: "Invalid messages" }, { status: 400 });
    }
    const history: ChatMessage[] = messages.slice(-10);
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
