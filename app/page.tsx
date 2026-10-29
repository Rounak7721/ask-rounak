"use client";

import { useRef, useState } from "react";

import type { ChatMessage } from "@/lib/llm/types";
import { useRecorder } from "@/hooks/useRecorder";
import { useSpeech } from "@/hooks/useSpeech";
import type { InputMode } from "@/lib/log";
import { useLive } from "@/hooks/useLive";

function waitText(seconds: number) {
  return seconds >= 60 ? `${Math.ceil(seconds / 60)} minutes` : `${seconds} seconds`;
}

const NO_SPEECH_REPLIES = [
  "Sorry, I didn't catch that. Could you say it again?",
  "I couldn't hear anything there. Mind trying once more?",
  "Hmm, that was a bit quiet. Could you repeat the question?",
];

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const sessionIdRef = useRef("");
  const abortRef = useRef<AbortController | null>(null);

  const { speaking, speak, stop: stopSpeaking, unlock } = useSpeech();


  async function send(text: string, inputMode: InputMode) {
    const question = text.trim();
    if (!question || loading) return;

    const next: ChatMessage[] = [...messages, { role: "user", content: question }];
    setMessages(next);
    setInput("");
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-10), sessionId: sessionIdRef.current, inputMode }),
      });
      const data = await res.json();
      const reply =
        res.status === 429
          ? `You're asking faster than I can think! Try again in ${waitText(data.retryAfter)}.`
          : res.ok && data.reply
            ? data.reply
            : "Sorry, something went wrong. Please try again.";
      speak(reply, () => {
        setMessages([...next, { role: "assistant", content: reply }]);
        setLoading(false);
      });
    } catch {
      if (controller.signal.aborted) return;
      setMessages([...next, { role: "assistant", content: "Sorry, I couldn't reach the server." }]);
      setLoading(false);
    }
  }

  const [notice, setNotice] = useState("");
  const [transcribing, setTranscribing] = useState(false);
  const { recording, start, stop } = useRecorder(handleAudio, handleNoSpeech);
  const { live, start: startLive, stop: stopLive } = useLive(interrupt, (wav) => handleAudio(wav, "live"));

  function interrupt() {
    abortRef.current?.abort();
    stopSpeaking();
    setLoading(false);
  }


  function handleNoSpeech() {
    const line = NO_SPEECH_REPLIES[Math.floor(Math.random() * NO_SPEECH_REPLIES.length)];
    speak(line, () => setMessages((prev) => [...prev, { role: "assistant", content: line }]));
  }

  async function handleAudio(audio: Blob, inputMode: InputMode = "voice") {

    setTranscribing(true);
    setNotice("");
    try {
      const form = new FormData();
      form.append("audio", audio);
      const controller = new AbortController();
      abortRef.current = controller;
      const res = await fetch("/api/transcribe", { method: "POST", body: form, signal: controller.signal });
      const data = await res.json();
      if (!res.ok) {
        setNotice(res.status === 429 ? `Too many questions too fast. Try again in ${waitText(data.retryAfter)}.` : "Sorry, something went wrong. Please try again.");
        return;
      }
      if (!/[a-z]/i.test(data.text ?? "")) return inputMode === "live" ? undefined : handleNoSpeech();
      send(data.text, inputMode);

    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
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

  const footer = (
    <p className="text-center text-xs text-zinc-500">
      This is an AI version of Rounak. Questions and answers are logged to improve it. No IP addresses are stored.
    </p>
  );

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
        {footer}
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
          onClick={() => (live ? stopLive() : startLive().catch(() => setNotice("Microphone access was blocked. Allow it in your browser, or type your question.")))}
          className="rounded-full bg-zinc-800 px-4 py-2 text-white"
        >
          {live ? "Live ●" : "Live"}
        </button>

        <button
          type="button"
          onClick={toggleMic}
                    disabled={loading || transcribing || live}

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
      {footer}
    </main>
  );
}
