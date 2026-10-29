"use client";

import { useState } from "react";

type ChatMessage = { role: "user" | "assistant"; content: string };

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send(text: string) {
    const question = text.trim();
    if (!question || loading) return;

    const next: ChatMessage[] = [...messages, { role: "user", content: question }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-10) }),
      });
      const data = await res.json();
      const reply = res.ok && data.reply ? data.reply : "Sorry, something went wrong. Please try again.";
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "Sorry, I couldn't reach the server." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">Ask Rounak</h1>

      <ul className="flex flex-1 flex-col gap-3">
        {messages.map((m, i) => (
          <li
            key={i}
            className={`max-w-[85%] rounded-2xl px-4 py-2 ${
              m.role === "user" ? "self-end bg-indigo-600 text-white" : "self-start bg-zinc-100 text-zinc-900"
            }`}
          >
            {m.content}
          </li>
        ))}
        {loading && <li className="self-start text-zinc-500">Thinking…</li>}
      </ul>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a question…"
          maxLength={2000}
          className="flex-1 rounded-full border border-zinc-300 px-4 py-2"
        />
        <button disabled={loading} className="rounded-full bg-indigo-600 px-5 py-2 text-white disabled:opacity-50">
          Send
        </button>
      </form>
    </main>
  );
}
