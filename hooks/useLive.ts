"use client";

import { useRef, useState } from "react";
import type { MicVAD } from "@ricky0123/vad-web";

const CDN = "https://cdn.jsdelivr.net/npm/";

export function useLive(onSpeechStart: () => void, onSpeechEnd: (wav: Blob) => void) {
  const [live, setLive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [muted, setMuted] = useState(false);
  const startingRef = useRef(false);
  const vadRef = useRef<MicVAD | null>(null);
  const levelRef = useRef(0); // mic loudness 0..1, read by the orb every frame
  const handlersRef = useRef({ onSpeechStart, onSpeechEnd });
  handlersRef.current = { onSpeechStart, onSpeechEnd };

  // Returns true once listening, false if a start was already in progress.
  async function start() {
    if (startingRef.current || vadRef.current) return false;
    startingRef.current = true;
    setStarting(true);
    try {
      const { MicVAD, utils } = await import("@ricky0123/vad-web");

      vadRef.current = await MicVAD.new({
        baseAssetPath: `${CDN}@ricky0123/vad-web@0.0.31/dist/`,
        onnxWASMBasePath: `${CDN}onnxruntime-web@1.31.1/dist/`,
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

  async function stop() {
    await vadRef.current?.destroy();
    vadRef.current = null;
    setLive(false);
    setMuted(false);
  }

  // pause() stops the mic tracks and drops any half-spoken audio, so nothing reaches STT.
  async function toggleMute() {
    if (!vadRef.current) return;
    await (muted ? vadRef.current.start() : vadRef.current.pause());
    levelRef.current = 0;
    setMuted(!muted);
  }

  return { live, starting, muted, levelRef, start, stop, toggleMute };
}
