"use client";

import { useRef, useState } from "react";

export const MAX_MS = 60_000;
const MIN_MS = 1_000;
const SPEECH_RMS = 0.02;

export function useRecorder(onAudio: (audio: Blob) => void, onNoSpeech: () => void) {
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const analyserRef = useRef<AnalyserNode | null>(null); // read by the recording spectrum

  async function start() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];

    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    ctx.createMediaStreamSource(stream).connect(analyser);
    analyserRef.current = analyser;
    const buf = new Float32Array(analyser.fftSize);
    let heard = false;
    const poll = setInterval(() => {
      analyser.getFloatTimeDomainData(buf);
      const rms = Math.sqrt(buf.reduce((sum, x) => sum + x * x, 0) / buf.length);
      if (rms > SPEECH_RMS) heard = true;
    }, 100);
    const startedAt = Date.now();

    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
      clearTimeout(timerRef.current);
      clearInterval(poll);
      analyserRef.current = null;
      const vadWorked = ctx.state === "running";
      ctx.close();
      stream.getTracks().forEach((t) => t.stop());
      setRecording(false);
      if (Date.now() - startedAt < MIN_MS) return;
      if (vadWorked && !heard) return onNoSpeech();
      onAudio(new Blob(chunks, { type: recorder.mimeType }));
    };

    recorder.start();
    timerRef.current = setTimeout(stop, MAX_MS);
    recorderRef.current = recorder;
    setRecording(true);
  }

  function stop() {
    recorderRef.current?.stop();
    recorderRef.current = null;
  }

  return { recording, analyserRef, start, stop };
}
