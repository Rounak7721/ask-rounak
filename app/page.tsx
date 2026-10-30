"use client";

import { useEffect, useRef, useState } from "react";

import type { ChatMessage } from "@/lib/llm/types";
import type { InputMode } from "@/lib/log";
import { useRecorder } from "@/hooks/useRecorder";
import { useSpeech } from "@/hooks/useSpeech";
import { useLive } from "@/hooks/useLive";
import { Brand, Disclosure, StatusPill } from "@/components/Brand";
import { Orb, type OrbState } from "@/components/Orb";
import { Panel } from "@/components/Panel";
import { RecordingView } from "@/components/RecordingView";
import { RoundButton } from "@/components/RoundButton";
import { StartScreen } from "@/components/StartScreen";

function waitText(seconds: number) {
  return seconds >= 60 ? `${Math.ceil(seconds / 60)} minutes` : `${seconds} seconds`;
}

const NO_SPEECH_REPLIES = [
  "Sorry, I didn't catch that. Could you say it again?",
  "I couldn't hear anything there. Mind trying once more?",
  "Hmm, that was a bit quiet. Could you repeat the question?",
];

const GREETING = "Hi, I'm an AI version of Rounak. Ask me anything about my work, projects or background. Just start talking.";
const MIC_BLOCKED = "Microphone access was blocked. Allow it in your browser, or type your question.";

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [transcribing, setTranscribing] = useState(false);
  const [greetingPending, setGreetingPending] = useState(false); // Start tapped, greeting not playing yet
  const sessionIdRef = useRef("");
  const abortRef = useRef<AbortController | null>(null);
  const autoMutedRef = useRef(false);

  const { speaking, voiceOff, speak, stop: stopSpeaking, unlock, toggleVoice } = useSpeech();
  const { recording, analyserRef, start, stop } = useRecorder(handleAudio, handleNoSpeech);
  const { live, starting, muted, levelRef, start: startLive, toggleMute } = useLive(interrupt, (wav) => handleAudio(wav, "live"));

  async function send(text: string, inputMode: InputMode) {
    const question = text.trim();
    if (!question || loading) return;

    const next: ChatMessage[] = [...messages, { role: "user", content: question }];
    setMessages(next);
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

  async function goLive(greet: boolean) {
    setNotice("");
    try {
      if ((await startLive()) && greet) {
        speak(GREETING, () => {
          setGreetingPending(false);
          setMessages((prev) => [...prev, { role: "assistant", content: GREETING }]);
        });
      } else setGreetingPending(false);
    } catch (err) {
      setGreetingPending(false);
      setNotice(
        err instanceof DOMException && err.name === "NotAllowedError"
          ? MIC_BLOCKED
          : "Live voice couldn't load. Tap to talk, or type instead.",
      );
    }
  }

  function interrupt() {
    abortRef.current?.abort();
    stopSpeaking();
    setLoading(false);
  }

  function startOver() {
    interrupt();
    setMessages([]);
    sessionIdRef.current = crypto.randomUUID();
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

  // Tap to talk pauses Live while recording, and resumes it once recording ends.
  async function toggleMic() {
    if (recording) return stop();
    stopSpeaking();
    setNotice("");
    if (live && !muted) {
      await toggleMute();
      autoMutedRef.current = true;
    }
    try {
      await start();
    } catch {
      setNotice(MIC_BLOCKED);
      resumeLive();
    }
  }

  function resumeLive() {
    if (!autoMutedRef.current) return;
    autoMutedRef.current = false;
    toggleMute();
  }

  useEffect(() => {
    if (!recording) resumeLive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording]);

  if (!started) {
    return (
      <StartScreen
        onStart={() => {
          sessionIdRef.current = crypto.randomUUID();
          unlock();
          setStarted(true);
          setGreetingPending(true);
          goLive(true);
        }}
      />
    );
  }

  const thinking = loading || transcribing;
  const preparing = starting || greetingPending;
  const voiceOn = live && !muted;
  const lastOf = (role: ChatMessage["role"]) => messages.findLast((m) => m.role === role)?.content ?? "";

  const orbState: OrbState = preparing ? "idle" : thinking ? "thinking" : speaking ? "speaking" : voiceOn ? "listening" : "muted";

  const [pill, tone]: [string, "live" | "rec" | "off"] = preparing && !speaking
    ? ["Preparing", "off"]
    : recording
      ? ["Recording", "rec"]
      : thinking
        ? ["Thinking", "live"]
        : speaking
          ? ["Speaking", "live"]
          : voiceOn
            ? ["Live", "live"]
            : ["Voice off", "off"];

  const [title, detail] = preparing && !speaking
    ? ["Preparing voice…", "Loading the speech model. You can type meanwhile."]
    : recording
      ? ["Tap stop when you're done", live ? "Live is paused while you record." : ""]
      : transcribing
        ? ["Transcribing…", ""]
        : loading
          ? ["Thinking…", lastOf("user")]
          : speaking
            ? ["", lastOf("assistant")]
            : voiceOn
              ? ["I'm listening", "Just start talking. Interrupt me any time."]
              : ["Voice mode is off", "The mic is off. Turn voice on, tap to talk, or type."];

  return (
    <div className="flex h-dvh overflow-hidden">
      <main className="flex min-w-0 flex-1 flex-col items-center px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
        <header className="flex w-full max-w-xl items-center justify-between">
          <Brand />
          <RoundButton
            icon={voiceOff ? "volumeOff" : "volume"}
            label={voiceOff ? "Turn voice on" : "Turn voice off"}
            onClick={toggleVoice}
            active={voiceOff}
          />
        </header>

        <div className="mt-3">
          <StatusPill label={pill} tone={tone} />
        </div>

        <div className="flex w-full flex-1 items-center justify-center">
          {recording ? (
            <RecordingView analyserRef={analyserRef} onStop={stop} />
          ) : (
            <button
              type="button"
              onClick={interrupt}
              disabled={!thinking && !speaking}
              aria-label="Interrupt"
              className="rounded-full disabled:cursor-default focus-visible:outline-2 focus-visible:outline-fg"
            >
              <Orb state={orbState} levelRef={levelRef} className="size-[min(78vw,46dvh,380px)]" />
            </button>
          )}
        </div>

        <div className="flex min-h-24 w-full max-w-md flex-col items-center gap-1.5 text-center" aria-live="polite">
          {title && <p className="text-[15px] font-medium">{title}</p>}
          {notice ? (
            <p className="text-[13px] leading-relaxed text-rec">{notice}</p>
          ) : speaking ? (
            <p className="line-clamp-3 font-display text-lg leading-snug text-fg/85">{detail}</p>
          ) : (
            detail && <p className="line-clamp-2 text-[13px] leading-relaxed text-muted">{detail}</p>
          )}
        </div>

        {!recording && (
          <nav className="mt-4 mb-4 flex items-end justify-center gap-10" aria-label="Controls">
            <RoundButton icon="mic" label="Tap to talk" caption="Tap to talk" onClick={toggleMic} disabled={thinking || starting} size="md" />
            {/* Voice mode pauses the mic (model stays loaded, so turning it back on is instant). */}
            <RoundButton
              icon="voice"
              label={voiceOn ? "Turn voice mode off" : "Turn voice mode on"}
              caption={voiceOn ? "Voice on" : "Voice off"}
              onClick={() => (live ? toggleMute() : goLive(false))}
              active={voiceOn}
              disabled={preparing}
              size="lg"
            />
            <RoundButton icon="chat" label="Type a question" caption="Type" onClick={() => setPanelOpen(!panelOpen)} active={panelOpen} size="md" />
          </nav>
        )}

        <Disclosure extra={voiceOn ? "The mic is on while voice mode is on" : undefined} />
      </main>

      {panelOpen && (
        <Panel messages={messages} busy={loading} onSend={send} onReset={startOver} onClose={() => setPanelOpen(false)} />
      )}
    </div>
  );
}
