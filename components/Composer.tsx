"use client";

import type { RefObject } from "react";
import { Icon } from "./Icon";
import { RoundButton } from "./RoundButton";
import { Waveform } from "./Waveform";

export type Dictation = {
  recording: boolean;
  transcribing: boolean;
  analyserRef: RefObject<AnalyserNode | null>;
  start: () => void;
  stop: (discard?: boolean) => void;
};

type Props = {
  input: string;
  setInput: (text: string) => void;
  busy: boolean;
  onSubmit: () => void;
  dictation: Dictation;
};

const BAR = "flex items-center gap-2 rounded-full border border-line bg-surface p-1.5";

// Text box with dictation. Dictated text lands in the box; the user still presses send.
export function Composer({ input, setInput, busy, onSubmit, dictation }: Props) {
  if (dictation.recording) {
    return (
      <div className={BAR}>
        <RoundButton icon="x" label="Cancel dictation" onClick={() => dictation.stop(true)} tone="ghost" />
        <Waveform analyserRef={dictation.analyserRef} />
        <RoundButton icon="stop" label="Stop dictation" onClick={() => dictation.stop()} tone="solid" />
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className={`${BAR} pl-4 focus-within:border-white/25`}
    >
      <label htmlFor="question" className="sr-only">Type a question</label>
      <input
        id="question"
        name="question"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={dictation.transcribing ? "Transcribing…" : "Type a question…"}
        disabled={dictation.transcribing}
        maxLength={2000}
        autoComplete="off"
        autoFocus
        className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted"
      />
      <RoundButton icon="mic" label="Dictate" onClick={dictation.start} tone="ghost" disabled={dictation.transcribing} />
      <button
        type="submit"
        disabled={busy || !input.trim()}
        aria-label="Send"
        className="grid size-10 shrink-0 place-items-center rounded-full bg-fg text-bg transition disabled:opacity-30"
      >
        <Icon name="up" className="size-4" />
      </button>
    </form>
  );
}
