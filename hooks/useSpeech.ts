"use client";

import { useEffect, useRef, useState } from "react";

export function useSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

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

  function speak(text: string) {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();

    const sentences = text.match(/[^.!?]+[.!?]*/g) ?? [text];
    sentences.forEach((sentence, i) => {
      const u = new SpeechSynthesisUtterance(sentence.trim());
      if (voiceRef.current) u.voice = voiceRef.current;
      if (i === 0) u.onstart = () => setSpeaking(true);
      if (i === sentences.length - 1) u.onend = () => setSpeaking(false);
      synth.speak(u);
    });
  }

  function stop() {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }

  function unlock() {
    const u = new SpeechSynthesisUtterance(" ");
    u.volume = 0;
    window.speechSynthesis?.speak(u);
  }

  return { speaking, speak, stop, unlock };
}
