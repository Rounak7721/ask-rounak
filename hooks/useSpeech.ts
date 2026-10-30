"use client";

import { useEffect, useRef, useState } from "react";

export function useSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const [voiceOff, setVoiceOff] = useState(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const onStartRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;

    const pickVoice = () => {
      const voices = synth.getVoices().filter((v) => v.lang.startsWith("en"));
      voiceRef.current =
        voices.find((v) => v.lang === "en-IN") ??
        voices.find((v) => v.name.includes("Male")) ??
        voices[0] ??
        null;
    };

    pickVoice();
    synth.addEventListener("voiceschanged", pickVoice);
    return () => synth.removeEventListener("voiceschanged", pickVoice);
  }, []);

  function flushStart() {
    const fn = onStartRef.current;
    onStartRef.current = null;
    fn?.();
  }

  function speakBrowser(text: string) {
    const synth = window.speechSynthesis;
    if (!synth) return flushStart();
    synth.cancel();

    const sentences = text.match(/[^.!?]+[.!?]*/g) ?? [text];
    sentences.forEach((sentence, i) => {
      const u = new SpeechSynthesisUtterance(sentence.trim());
      if (voiceRef.current) u.voice = voiceRef.current;
      if (i === 0) u.onstart = () => { flushStart(); setSpeaking(true); };
      if (i === sentences.length - 1) u.onend = () => setSpeaking(false);
      synth.speak(u);
    });
  }

  function speak(text: string, onStart?: () => void) {
    stop();
    onStartRef.current = onStart ?? null;
    if (voiceOff) return flushStart(); // text only, no /api/tts call
    const audio = new Audio(`/api/tts?text=${encodeURIComponent(text)}`);
    audioRef.current = audio;
    audio.onplaying = () => { flushStart(); setSpeaking(true); };
    audio.onended = () => setSpeaking(false);
    audio.play().catch(() => {
      if (audioRef.current === audio) speakBrowser(text);
    });
  }

  function stop() {
    flushStart();
    const audio = audioRef.current;
    audioRef.current = null;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }

  function unlock() {
    const u = new SpeechSynthesisUtterance(" ");
    u.volume = 0;
    window.speechSynthesis?.speak(u);
  }

  function toggleVoice() {
    if (!voiceOff) stop();
    setVoiceOff(!voiceOff);
  }

  return { speaking, voiceOff, speak, stop, unlock, toggleVoice };
}
