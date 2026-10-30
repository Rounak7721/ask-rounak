import { Brand, Disclosure } from "./Brand";
import { Icon } from "./Icon";
import { Orb } from "./Orb";

export function StartScreen({ onStart }: { onStart: () => void }) {
  return (
    <main className="flex h-dvh flex-col items-center px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <Orb state="idle" className="size-[min(70vw,300px)]" />
        <Brand className="text-5xl" />
        <p className="max-w-[30ch] text-[15px] leading-relaxed text-muted">
          An AI version of Rounak. Ask about his work, projects and background, out loud.
        </p>
        <button
          type="button"
          onClick={onStart}
          className="inline-flex items-center gap-2 rounded-full bg-fg px-7 py-3.5 text-[15px] font-medium text-bg transition hover:bg-white active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-fg"
        >
          Start talking <Icon name="arrow" className="size-4" />
        </button>
      </div>
      <Disclosure />
    </main>
  );
}
