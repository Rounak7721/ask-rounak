// Voice mode on/off chimes, synthesised with Web Audio (no sound files).
let ctx: AudioContext | null = null;

// Call from a tap so mobile browsers allow the AudioContext to play later.
export function primeSounds() {
  ctx ??= new AudioContext();
  void ctx.resume();
}

export function chime(kind: "on" | "off") {
  if (!ctx) return;
  void ctx.resume();
  const notes = kind === "on" ? [587, 880] : [880, 587];
  notes.forEach((freq, i) => {
    const t = ctx!.currentTime + i * 0.09;
    const osc = ctx!.createOscillator();
    const gain = ctx!.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.12, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    osc.connect(gain).connect(ctx!.destination);
    osc.start(t);
    osc.stop(t + 0.25);
  });
}
