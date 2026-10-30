export function Brand({ className = "text-2xl" }: { className?: string }) {
  return (
    <h1 className={`font-display leading-none ${className}`}>
      Ask <i className="text-muted">Rounak</i>
    </h1>
  );
}

export function Disclosure({ extra }: { extra?: string }) {
  return (
    <p className="text-center text-[11px] leading-relaxed text-faint">
      AI version of Rounak · Questions and answers are logged to improve it · No IP addresses stored
      {extra && ` · ${extra}`}
    </p>
  );
}

const DOT = { live: "bg-fg shadow-[0_0_8px_white]", rec: "bg-rec shadow-[0_0_8px_var(--color-rec)]", off: "bg-faint" };

export function StatusPill({ label, tone }: { label: string; tone: keyof typeof DOT }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-[11px] tracking-[0.08em] text-muted uppercase">
      <span className={`size-1.5 rounded-full ${DOT[tone]}`} />
      {label}
    </span>
  );
}
