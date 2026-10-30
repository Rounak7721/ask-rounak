"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/llm/types";
import type { InputMode } from "@/lib/log";
import { Icon } from "./Icon";
import { RoundButton } from "./RoundButton";

const CHIPS = ["Tell me your life story", "What's your superpower?", "What are you proudest of?", "Why 100x?"];

type Props = {
  messages: ChatMessage[];
  busy: boolean;
  onSend: (text: string, mode: InputMode) => void;
  onReset: () => void;
  onClose: () => void;
};

function download(messages: ChatMessage[]) {
  const text = messages.map((m) => `${m.role === "user" ? "You" : "Rounak (AI)"}: ${m.content}`).join("\n\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  a.download = "ask-rounak-transcript.txt";
  a.click();
  URL.revokeObjectURL(a.href);
}

// Transcript + typing. A full-screen sheet on phones, a docked column on desktop.
export function Panel({ messages, busy, onSend, onReset, onClose }: Props) {
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const asked = messages.some((m) => m.role === "user");

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  function submit(text: string, mode: InputMode) {
    if (busy || !text.trim()) return;
    onSend(text, mode);
    setInput("");
  }

  return (
    <aside className="fixed inset-0 z-20 flex animate-sheet-in flex-col bg-bg/95 px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-xl md:static md:z-auto md:w-[380px] md:border-l md:border-line md:bg-surface">
      <div className="flex items-center justify-between border-b border-line pb-3">
        <h2 className="text-[15px] font-medium">Conversation</h2>
        <div className="flex gap-1.5">
          <RoundButton icon="download" label="Download transcript" onClick={() => download(messages)} disabled={!messages.length} />
          <RoundButton icon="reset" label="Start over" onClick={onReset} disabled={!messages.length} />
          <RoundButton icon="x" label="Close" onClick={onClose} />
        </div>
      </div>

      <div ref={listRef} className="flex flex-1 flex-col gap-2.5 overflow-y-auto py-4" aria-live="polite">
        {!messages.length && <p className="m-auto max-w-[24ch] text-center text-sm text-muted">Your conversation will show up here.</p>}
        {messages.map((m, i) => (
          <p
            key={i}
            className={`max-w-[86%] rounded-[18px] px-3.5 py-2.5 text-[14px] leading-relaxed ${
              m.role === "user" ? "self-end rounded-br-md bg-fg text-bg" : "self-start rounded-bl-md bg-surface-2"
            }`}
          >
            {m.content}
          </p>
        ))}
      </div>

      {!asked && (
        <div className="flex flex-wrap gap-1.5 pb-3">
          {CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => submit(chip, "chip")}
              disabled={busy}
              className="rounded-full border border-line bg-surface px-3 py-1.5 text-[12.5px] transition hover:bg-surface-2 disabled:opacity-40"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(input, "text");
        }}
        className="flex items-center gap-2 rounded-full border border-line bg-surface py-1.5 pr-1.5 pl-4 focus-within:border-white/25"
      >
        <label htmlFor="question" className="sr-only">Type a question</label>
        <input
          id="question"
          name="question"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a question…"
          maxLength={2000}
          autoComplete="off"
          autoFocus
          className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          aria-label="Send"
          className="grid size-9 shrink-0 place-items-center rounded-full bg-fg text-bg transition disabled:opacity-30"
        >
          <Icon name="up" className="size-4" />
        </button>
      </form>
    </aside>
  );
}
