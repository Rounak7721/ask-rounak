import { chatWithFallback } from "@/lib/llm";
import type { ChatMessage } from "@/lib/llm/types"

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

    try {
        const { reply, provider } = await chatWithFallback(history);
        return Response.json({ reply, provider });
    } catch {
        return Response.json({ error: "LLM request failed" }, { status: 502 });
    }
}
