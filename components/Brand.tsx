export function Brand({ className = "text-lg" }: { className?: string }) {
  return <h1 className={`leading-none font-semibold tracking-tight ${className}`}>Ask Rounak</h1>;
}

export function Disclosure({ extra }: { extra?: string }) {
  return (
    <p className="max-w-md text-center text-[11px] leading-relaxed text-faint">
      You&apos;re talking to an AI version of Rounak. Questions and answers are saved to improve it, IP addresses are not.
      {extra && ` ${extra}.`}
    </p>
  );
}
