"use client";

import { useEffect, useRef, type RefObject } from "react";
import { RECORDING } from "@/lib/config";

const STEP = 5; // px between bars

// Scrolling loudness history of the mic (newest on the right), plus the time left before the 60 s cap.
// It mounts when recording starts, so its own clock is the recording clock.
export function Waveform({ analyserRef }: { analyserRef: RefObject<AnalyserNode | null> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const started = performance.now();
    const levels: number[] = [];
    const buf = new Float32Array(2048);
    let lastPush = 0;
    let raf = 0;

    function frame(now: number) {
      const secs = Math.ceil(Math.max(0, RECORDING.maxMs - (now - started)) / 1000);
      countRef.current!.textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;

      const analyser = analyserRef.current;
      if (analyser && now - lastPush > 60) {
        lastPush = now;
        const data = buf.subarray(0, analyser.fftSize);
        analyser.getFloatTimeDomainData(data);
        const rms = Math.sqrt(data.reduce((sum, x) => sum + x * x, 0) / data.length);
        levels.push(Math.min(1, rms * 6));
        if (levels.length > 300) levels.shift();
      }

      const dpr = devicePixelRatio || 1;
      const w = canvas!.clientWidth * dpr;
      const h = canvas!.clientHeight * dpr;
      if (canvas!.width !== w || canvas!.height !== h) {
        canvas!.width = w;
        canvas!.height = h;
      }
      ctx!.clearRect(0, 0, w, h);
      const n = Math.floor(w / (STEP * dpr));
      for (let i = 0; i < n; i++) {
        const v = levels[levels.length - n + i] ?? 0;
        const bh = Math.max(2 * dpr, v * h);
        ctx!.fillStyle = `rgba(255,255,255,${0.3 + v * 0.7})`;
        ctx!.beginPath();
        ctx!.roundRect(i * STEP * dpr, (h - bh) / 2, 2 * dpr, bh, dpr);
        ctx!.fill();
      }
      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [analyserRef]);

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <canvas ref={canvasRef} className="h-7 min-w-0 flex-1" aria-hidden="true" />
      <span ref={countRef} className="text-xs text-muted tabular-nums">1:00</span>
    </div>
  );
}
