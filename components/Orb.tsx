"use client";

import { useEffect, useRef, type RefObject } from "react";

export type OrbState = "idle" | "listening" | "thinking" | "speaking" | "muted";

// How each state looks. The orb eases between these, so state changes morph instead of jumping.
const LOOK: Record<OrbState, { amp: number; spin: number; pull: number; alpha: number }> = {
  idle: { amp: 0.05, spin: 0.12, pull: 1, alpha: 0.75 },
  listening: { amp: 0.07, spin: 0.22, pull: 1, alpha: 1 },
  thinking: { amp: 0.03, spin: 1.2, pull: 0.78, alpha: 0.9 },
  speaking: { amp: 0.07, spin: 0.28, pull: 1, alpha: 1 },
  muted: { amp: 0, spin: 0.04, pull: 0.9, alpha: 0.3 },
};

// Points spread evenly over a sphere (Fibonacci lattice), with their angles precomputed.
const COUNT = 800;
const POINTS = Array.from({ length: COUNT }, (_, i) => {
  const y = 1 - (i / (COUNT - 1)) * 2;
  const r = Math.sqrt(1 - y * y);
  const x = Math.cos(i * 2.39996) * r;
  const z = Math.sin(i * 2.39996) * r;
  return { x, y, z, theta: Math.atan2(z, x), phi: Math.acos(y) };
});

// Browsers don't expose the reply audio cheaply, so speaking uses a syllable-like pulse.
function speechPulse(t: number) {
  const syllable = Math.max(0, Math.sin(t * 7.3) * Math.sin(t * 2.1));
  return Math.min(1, syllable * (Math.sin(t * 0.6) > -0.3 ? 1.3 : 0.2));
}

type Props = { state: OrbState; levelRef?: RefObject<number>; className?: string };

export function Orb({ state, levelRef, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1;
    const look = { ...LOOK[stateRef.current] };
    let level = 0;
    let angle = 0;
    let last = performance.now();
    let raf = 0;

    function frame(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = (now / 1000) * motion;
      const s = stateRef.current;
      for (const k of Object.keys(look) as (keyof typeof look)[]) look[k] += (LOOK[s][k] - look[k]) * 0.06;
      const input = s === "listening" ? (levelRef?.current ?? 0) : s === "speaking" ? speechPulse(t) : 0;
      level += (input * motion - level) * 0.15;
      angle += dt * look.spin * motion;

      const dpr = devicePixelRatio || 1;
      const w = canvas!.clientWidth * dpr;
      const h = canvas!.clientHeight * dpr;
      if (canvas!.width !== w || canvas!.height !== h) {
        canvas!.width = w;
        canvas!.height = h;
      }
      const cx = w / 2;
      const cy = h / 2;
      const R = Math.min(w, h) * 0.36 * look.pull * (1 + level * 0.12);

      ctx!.clearRect(0, 0, w, h);
      const glow = ctx!.createRadialGradient(cx, cy, 0, cx, cy, R * 1.35);
      glow.addColorStop(0, `rgba(255,255,255,${(0.06 + level * 0.1) * look.alpha})`);
      glow.addColorStop(1, "rgba(255,255,255,0)");
      ctx!.fillStyle = glow;
      ctx!.fillRect(0, 0, w, h);

      ctx!.globalCompositeOperation = "lighter";
      const ca = Math.cos(angle), sa = Math.sin(angle);
      const ct = Math.cos(0.4), st = Math.sin(0.4);
      const wobAmp = look.amp + level * 0.3;
      for (const p of POINTS) {
        const wob = 1 + wobAmp * Math.sin(3 * p.theta + t * 2.2) * Math.cos(2 * p.phi - t * 1.6);
        const x = p.x * wob, y = p.y * wob, z = p.z * wob;
        const x1 = x * ca - z * sa;
        const z1 = x * sa + z * ca;
        const y1 = y * ct - z1 * st;
        const z2 = y * st + z1 * ct;
        const persp = 1.6 / (2.6 - z2);
        const depth = (z2 + 1) / 2;
        const size = (0.5 + depth * 1.3) * dpr;
        ctx!.fillStyle = `rgba(255,255,255,${(0.08 + depth * 0.8) * look.alpha})`;
        ctx!.fillRect(cx + x1 * R * persp - size / 2, cy + y1 * R * persp - size / 2, size, size);
      }
      ctx!.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [levelRef]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
