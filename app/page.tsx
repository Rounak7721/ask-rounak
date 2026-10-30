"use client";

import { useEffect, useRef, useState } from "react";

import type { ChatMessage } from "@/lib/llm/types";
import type { InputMode } from "@/lib/log";
import { chime, primeSounds } from "@/lib/sounds";
import { useRecorder } from "@/hooks/useRecorder";
import { useSpeech } from "@/hooks/useSpeech";
import { liveSupported, useLive } from "@/hooks/useLive";
import { Brand, Disclosure } from "@/components/Brand";
import { Orb, type OrbState } from "@/components/Orb";
import { Panel } from "@/components/Panel";
import { RoundButton } from "@/components/RoundButton";
import { StartScreen } from "@/components/StartScreen";

function waitText(seconds: number) {
  return seconds >= 60 ? `${Math.ceil(seconds / 60)} minutes` : `${seconds} seconds`;
}

const GREETING = "Hi, I'm an AI version of Rounak. Ask me anything about my work, projects or background. Just start talking.";
const MIC_BLOCKED = "Microphone access was blocked. Allow it in your browser settings, or use the chat.";
const UNSUPPORTED = "Your device doesn't support voice mode. You can still dictate or type in the chat.";
const LOAD_FAILED = "Voice mode couldn't load on this device. You can still dictate or type in the chat.";

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [voiceError, setVoiceError] = useState("");
  const [transcribing, setTranscribing] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [greetingPending, setGreetingPending] = useState(false); // voice mode starting, greeting not playing yet
  const sessionIdRef = useRef("");
  const abortRef = useRef<AbortController | null>(null);
  const dictatedRef = useRef(false); // the text box was filled by dictation (logged as "voice")
  const voiceModeRef = useRef(false); // for checks after an await, where state would be stale

  const { speaking, voiceOff, speak, preload, stop: stopSpeaking, unlock, toggleVoice } = useSpeech();
  const { recording, analyserRef, start: startRecording, stop: stopRecording } = useRecorder(handleDictation, () =>
    setNotice("I couldn't hear anything. Try dictating again."),
  );
  const { live, starting, levelRef, start: loadVoice, setListening } = useLive(interrupt, handleLiveSpeech);

  // The VAD listens only in voice mode, unmuted, and not while dictating.
  const wantListening = voiceMode && !micMuted && !recording;
  useEffect(() => {
    setListening(wantListening);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantListening, live]);

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

  function sendTyped() {
    if (loading || !input.trim()) return;
    send(input, dictatedRef.current ? "voice" : "text");
    setInput("");
    dictatedRef.current = false;
  }

  async function startVoice(greet: boolean) {
    setNotice("");
    setVoiceError("");
    if (!liveSupported()) return setVoiceError(UNSUPPORTED);
    voiceModeRef.current = true;
    setVoiceMode(true);
    setMicMuted(false);
    if (greet) {
      setGreetingPending(true);
      preload(GREETING); // fetch the greeting audio while the model loads
    }
    try {
      await loadVoice();
      if (!voiceModeRef.current) return; // ended while the model was loading
      chime("on");
      if (!greet) return;
      setTimeout(
        () =>
          speak(GREETING, () => {
            setGreetingPending(false);
            setMessages((prev) => [...prev, { role: "assistant", content: GREETING }]);
          }),
        350,
      );
    } catch (err) {
      voiceModeRef.current = false;
      setVoiceMode(false);
      setGreetingPending(false);
      setVoiceError(err instanceof DOMException && err.name === "NotAllowedError" ? MIC_BLOCKED : LOAD_FAILED);
    }
  }

  function endVoice() {
    interrupt();
    voiceModeRef.current = false;
    setVoiceMode(false);
    setGreetingPending(false);
    chime("off");
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

  // Returns the transcript, or null after showing why it failed.
  async function transcribe(audio: Blob): Promise<string | null> {
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
        return null;
      }
      return /[a-z]/i.test(data.text ?? "") ? data.text.trim() : null;
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) setNotice("Couldn't reach the server. Please try again.");
      return null;
    } finally {
      setTranscribing(false);
    }
  }

  async function handleLiveSpeech(wav: Blob) {
    const text = await transcribe(wav);
    if (text) send(text, "live");
  }

  async function handleDictation(audio: Blob) {
    const text = await transcribe(audio);
    if (!text) return;
    setInput((prev) => (prev.trim() ? `${prev.trim()} ${text}` : text));
    dictatedRef.current = true;
  }

  async function startDictation() {
    setPanelOpen(true);
    stopSpeaking();
    setNotice("");
    try {
      await startRecording();
    } catch {
      setNotice("Microphone access was blocked. Allow it in your browser settings, or type instead.");
    }
  }

  if (!started) {
    return (
      <StartScreen
        onStart={() => {
          sessionIdRef.current = crypto.randomUUID();
          unlock();
          primeSounds();
          setStarted(true);
          startVoice(true);
        }}
      />
    );
  }

  const thinking = loading || transcribing;
  const preparing = (starting || greetingPending) && !speaking;
  const listening = voiceMode && !micMuted;
  const lastOf = (role: ChatMessage["role"]) => messages.findLast((m) => m.role === role)?.content ?? "";

  const orbState: OrbState = preparing ? "idle" : thinking ? "thinking" : speaking ? "speaking" : listening ? "listening" : "muted";

  const [title, detail] = preparing
    ? ["Preparing voice…", "Loading the speech model. You can open the chat meanwhile."]
    : recording
      ? ["Dictating…", "Stop when you're done, then send from the chat."]
      : transcribing
        ? ["Transcribing…", ""]
        : loading
          ? ["Thinking…", lastOf("user")]
          : speaking
            ? ["", lastOf("assistant")]
            : listening
              ? ["I'm listening", "Just start talking. Interrupt me any time."]
              : voiceMode
                ? ["Mic is off", "Nothing is sent while muted. Unmute to keep talking."]
                : ["Voice mode is off", "Turn it on to talk, or dictate and type in the chat."];

  return (
    <div className="flex h-dvh overflow-hidden">
      <main className="flex min-w-0 flex-1 flex-col items-center px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
        <header className="flex w-full max-w-xl items-center justify-between">
          <Brand />
          <RoundButton
            icon={voiceOff ? "volumeOff" : "volume"}
            label={voiceOff ? "Turn spoken replies on" : "Turn spoken replies off"}
            onClick={toggleVoice}
            tone={voiceOff ? "solid" : "default"}
          />
        </header>

        <div className="flex w-full flex-1 items-center justify-center">
          <button
            type="button"
            onClick={interrupt}
            disabled={!thinking && !speaking}
            aria-label="Interrupt"
            className="rounded-full disabled:cursor-default focus-visible:outline-2 focus-visible:outline-fg"
          >
            <Orb state={orbState} levelRef={levelRef} className="size-[min(78vw,46dvh,380px)]" />
          </button>
        </div>

        <div className="flex min-h-24 w-full max-w-md flex-col items-center gap-1.5 text-center" aria-live="polite">
          {voiceError ? (
            <>
              <p className="text-[14px] leading-relaxed text-muted">{voiceError}</p>
              <button
                type="button"
                onClick={() => setPanelOpen(true)}
                className="mt-1 rounded-full bg-fg px-4 py-2 text-[13px] font-medium text-bg transition hover:bg-white"
              >
                Open chat
              </button>
            </>
          ) : (
            <>
              {title && <p className="text-[15px] font-medium">{title}</p>}
              {notice && !panelOpen ? (
                <p className="text-[13px] leading-relaxed text-rec">{notice}</p>
              ) : speaking ? (
                <p className="line-clamp-3 text-lg leading-snug font-light text-fg/85">{detail}</p>
              ) : (
                detail && <p className="line-clamp-2 text-[13px] leading-relaxed text-muted">{detail}</p>
              )}
            </>
          )}
        </div>

        <nav className="my-4 flex items-center gap-1.5 rounded-full border border-line bg-surface p-1.5" aria-label="Controls">
          {voiceMode ? (
            <>
              <RoundButton
                icon={micMuted ? "micOff" : "mic"}
                label={micMuted ? "Turn on microphone" : "Turn off microphone"}
                onClick={() => setMicMuted(!micMuted)}
                tone={micMuted ? "danger" : "ghost"}
                disabled={preparing}
                size="md"
              />
              <RoundButton icon="x" label="End voice mode" onClick={endVoice} tone="solid" size="md" />
            </>
          ) : (
            <>
              <RoundButton icon="mic" label="Dictate" onClick={startDictation} tone="ghost" disabled={recording || transcribing} size="md" />
              <RoundButton icon="chat" label="Open chat" onClick={() => setPanelOpen(!panelOpen)} tone="ghost" size="md" />
              <RoundButton icon="voice" label="Start voice mode" onClick={() => startVoice(false)} tone="solid" disabled={starting} size="md" />
            </>
          )}
        </nav>

        <Disclosure extra={listening ? "The mic is on while voice mode is on" : undefined} />
      </main>

      {panelOpen && (
        <Panel
          messages={messages}
          busy={loading}
          input={input}
          setInput={setInput}
          onSubmit={sendTyped}
          onChip={(chip) => send(chip, "chip")}
          notice={notice}
          dictation={{ recording, transcribing, analyserRef, start: startDictation, stop: stopRecording }}
          onReset={startOver}
          onClose={() => setPanelOpen(false)}
        />
      )}
    </div>
  );
}
