"use client";

import { useRef, useState } from "react";
import type { MicVAD } from "@ricky0123/vad-web";
import { ENDPOINTS } from "@/lib/config";

// What the VAD needs: mic access, Web Audio and WebAssembly (for the speech model).
export function liveSupported() {
  return !!navigator.mediaDevices?.getUserMedia && "AudioContext" in window && typeof WebAssembly === "object";
}

export function useLive(onSpeechStart: () => void, onSpeechEnd: (wav: Blob) => void) {
  const [live, setLive] = useState(false); // model loaded
  const [starting, setStarting] = useState(false);
  const startingRef = useRef(false);
  const vadRef = useRef<MicVAD | null>(null);
  const levelRef = useRef(0); // mic loudness 0..1, read by the orb every frame
  const handlersRef = useRef({ onSpeechStart, onSpeechEnd });
  handlersRef.current = { onSpeechStart, onSpeechEnd };

  // Loads the model and starts listening. Returns false if it was already loaded or loading.
  async function start() {
    if (startingRef.current || vadRef.current) return false;
    startingRef.current = true;
    setStarting(true);
    try {
      const { MicVAD, utils } = await import("@ricky0123/vad-web");

      vadRef.current = await MicVAD.new({
        baseAssetPath: ENDPOINTS.vadAssets,
        onnxWASMBasePath: ENDPOINTS.onnxWasm,
        onSpeechRealStart: () => handlersRef.current.onSpeechStart(),
        onSpeechEnd: (audio) =>
          handlersRef.current.onSpeechEnd(new Blob([utils.encodeWAV(audio)], { type: "audio/wav" })),
        onFrameProcessed: (_, frame) => {
          const rms = Math.sqrt(frame.reduce((sum, x) => sum + x * x, 0) / frame.length);
          levelRef.current = Math.min(1, rms * 8);
        },
      });
      setLive(true);
      return true;
    } finally {
      startingRef.current = false;
      setStarting(false);
    }
  }

  // pause() stops the mic tracks and drops any half-spoken audio, so nothing reaches STT.
  // start() turns the mic back on without reloading the model. Both are no-ops if already in that state.
  async function setListening(on: boolean) {
    const vad = vadRef.current;
    if (!vad) return;
    await (on ? vad.start() : vad.pause());
    levelRef.current = 0;
  }

  return { live, starting, levelRef, start, setListening };
}
