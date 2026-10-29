"use client";

import { useRef, useState } from "react";

import type { ChatMessage } from "@/lib/llm/types";
import { useRecorder } from "@/hooks/useRecorder";
import { useSpeech } from "@/hooks/useSpeech";
import type { InputMode } from "@/lib/log";

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const sessionIdRef = useRef("");
  const { speaking, speak, stop: stopSpeaking, unlock } = useSpeech();


  async function send(text: string, inputMode: InputMode) {
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
        body: JSON.stringify({ messages: next.slice(-10), sessionId: sessionIdRef.current, inputMode }),
      });
      const data = await res.json();
      const reply = res.ok && data.reply ? data.reply : "Sorry, something went wrong. Please try again.";
      speak(reply, () => {
        setMessages([...next, { role: "assistant", content: reply }]);
        setLoading(false);
      });
    } catch {
      setMessages([...next, { role: "assistant", content: "Sorry, I couldn't reach the server." }]);
      setLoading(false);
    }
  }

  const [notice, setNotice] = useState("");
  const [transcribing, setTranscribing] = useState(false);
  const { recording, start, stop } = useRecorder(handleAudio);

  async function handleAudio(audio: Blob) {
    setTranscribing(true);
    setNotice("");
    try {
      const form = new FormData();
      form.append("audio", audio);
      const res = await fetch("/api/transcribe", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok || !data.text) {
        setNotice("Sorry, I didn't catch that. Please try again.");
        return;
      }
      send(data.text, "voice");
    } catch {
      setNotice("Couldn't reach the server. Please try again.");
    } finally {
      setTranscribing(false);
    }
  }

  async function toggleMic() {
    if (recording) {
      stop();
      return;
    }

    stopSpeaking();

    setNotice("");
    try {
      await start();
    } catch {
      setNotice("Microphone access was blocked. Allow it in your browser, or type your question.");
    }
  }

  if (!started) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
        <h1 className="text-3xl font-semibold">Ask Rounak</h1>
        <p className="text-zinc-500">Ask me any questions by voice or text.</p>
        <button
          onClick={() => {
            sessionIdRef.current = crypto.randomUUID();
            unlock();
            setStarted(true);
          }}
          className="rounded-full bg-indigo-600 px-8 py-3 text-lg text-white"
        >
          Start
        </button>
      </main>
    );
  }

  const status = recording
    ? "Listening… tap Stop when you're done."
    : transcribing
      ? "Transcribing…"
      : loading
        ? "Thinking…"
        : speaking
          ? "Speaking…"
          : "Tap 🎤 to ask, or type below.";


  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">Ask Rounak</h1>

      <ul className="flex flex-1 flex-col gap-3">
        {messages.map((m, i) => (
          <li
            key={i}
            className={`max-w-[85%] rounded-2xl px-4 py-2 ${m.role === "user" ? "self-end bg-indigo-600 text-white" : "self-start bg-zinc-100 text-zinc-900"
              }`}
          >
            {m.content}
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between text-sm">
        <p className={notice ? "text-red-600" : "text-zinc-500"}>{notice || status}</p>
        {speaking && (
          <button type="button" onClick={stopSpeaking} className="text-indigo-600">
            Stop speaking
          </button>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input, "text");
        }}
        className="flex gap-2"
      >
        <button
          type="button"
          onClick={toggleMic}
          disabled={loading || transcribing}
          className={`rounded-full px-4 py-2 text-white disabled:opacity-50 ${recording ? "bg-red-600" : "bg-zinc-800"}`}
        >
          {recording ? "Stop" : "🎤"}
        </button>
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
