"use client";

import { useEffect, useRef, type RefObject } from "react";
import { MAX_MS } from "@/hooks/useRecorder";

const RING = 2 * Math.PI * 62;
const BARS = 32;

type Props = { analyserRef: RefObject<AnalyserNode | null>; onStop: () => void };

// Tap-to-talk screen: countdown, live spectrum from the mic, and a stop button.
// It mounts when recording starts, so its own clock is the recording clock.
export function RecordingView({ analyserRef, onStop }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const started = performance.now();
    let data = new Uint8Array(0);
    let raf = 0;

    function frame(now: number) {
      const left = Math.max(0, MAX_MS - (now - started));
      const secs = Math.ceil(left / 1000);
      countRef.current!.textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
      ringRef.current!.style.strokeDashoffset = String(RING * (1 - left / MAX_MS));

      const analyser = analyserRef.current;
      if (analyser && data.length !== analyser.frequencyBinCount) data = new Uint8Array(analyser.frequencyBinCount);
      analyser?.getByteFrequencyData(data);

      const dpr = devicePixelRatio || 1;
      const w = canvas!.clientWidth * dpr;
      const h = canvas!.clientHeight * dpr;
      if (canvas!.width !== w || canvas!.height !== h) {
        canvas!.width = w;
        canvas!.height = h;
      }
      ctx!.clearRect(0, 0, w, h);
      const gap = 3 * dpr;
      const bw = (w - gap * (BARS - 1)) / BARS;
      for (let i = 0; i < BARS; i++) {
        // Bins 2..~130 cover roughly 50 Hz to 3 kHz, where speech lives.
        const v = (data[2 + i * 4] ?? 0) / 255;
        const bh = Math.max(3 * dpr, v * h);
        ctx!.fillStyle = `rgba(255,255,255,${0.25 + v * 0.75})`;
        ctx!.beginPath();
        ctx!.roundRect(i * (bw + gap), (h - bh) / 2, bw, bh, bw / 2);
        ctx!.fill();
      }
      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [analyserRef]);

  return (
    <div className="flex animate-fade-in flex-col items-center gap-7">
      <span ref={countRef} className="text-4xl font-light tracking-tight tabular-nums">1:00</span>
      <canvas ref={canvasRef} className="h-24 w-[min(72vw,280px)]" aria-hidden="true" />
      <div className="relative grid size-32 place-items-center">
        <svg viewBox="0 0 132 132" className="absolute inset-0 -rotate-90" aria-hidden="true">
          <circle cx="66" cy="66" r="62" fill="none" stroke="rgb(255 255 255 / 0.08)" strokeWidth="3" />
          <circle ref={ringRef} cx="66" cy="66" r="62" fill="none" stroke="var(--color-rec)" strokeWidth="3" strokeLinecap="round" strokeDasharray={RING} />
        </svg>
        <button
          type="button"
          onClick={onStop}
          aria-label="Stop recording"
          className="grid size-20 place-items-center rounded-full bg-rec shadow-[0_0_40px_rgb(248_113_113/0.35)] transition active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-fg"
        >
          <span className="size-6 rounded-md bg-white" />
        </button>
      </div>
    </div>
  );
}
