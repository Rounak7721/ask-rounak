"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/lib/llm/types";
import { Composer, type Dictation } from "./Composer";
import { RoundButton } from "./RoundButton";

type Props = {
  messages: ChatMessage[];
  busy: boolean;
  input: string;
  setInput: (text: string) => void;
  onSubmit: () => void;
  notice: string;
  dictation: Dictation;
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
export function Panel({ messages, busy, input, setInput, onSubmit, notice, dictation, onReset, onClose }: Props) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  return (
    <aside className="fixed inset-0 z-20 flex animate-sheet-in flex-col bg-bg/95 px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-xl md:static md:z-auto md:w-95 md:border-l md:border-line md:bg-surface">
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

      {notice && <p className="pb-2 text-center text-[12.5px] text-rec">{notice}</p>}
      <Composer input={input} setInput={setInput} busy={busy} onSubmit={onSubmit} dictation={dictation} />
    </aside>
  );
}
