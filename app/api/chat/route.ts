import { SYSTEM_PROMPT } from "@/lib/persona";

type ChatMessage = { role: "user" | "assistant"; content: string };

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

const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.GROQ_CHAT_MODEL,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...history],
      reasoning_effort: "low",
      max_completion_tokens: 1000,
      temperature: 0.4,
    }),
  });
  
  if (!res.ok) {
    console.error("Groq error", res.status, await res.text());
    return Response.json({ error: "LLM request failed" }, { status: 502 });
  }

  const data = await res.json();
  const reply: string = data.choices?.[0]?.message?.content?.trim() ?? "";
  return Response.json({ reply });
}