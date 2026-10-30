import { Brand, Disclosure } from "./Brand";
import { Orb } from "./Orb";

// The orb is the start button: one tap unlocks the mic and audio, then voice mode loads.
export function StartScreen({ onStart }: { onStart: () => void }) {
  return (
    <main className="flex h-dvh flex-col items-center px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
        <Brand className="text-4xl" />
        <p className="max-w-[30ch] text-[15px] leading-relaxed text-muted">
          An AI version of Rounak. Ask about his work, projects and background, out loud.
        </p>
        <button
          type="button"
          onClick={onStart}
          aria-label="Start a conversation"
          className="group mt-2 flex flex-col items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-fg"
        >
          <Orb state="idle" className="size-[min(72vw,320px)] transition group-hover:scale-[1.03] group-active:scale-[0.98]" />
          <span className="-mt-6 text-[13px] text-muted transition group-hover:text-fg">Tap the orb to start</span>
        </button>
      </div>
      <Disclosure />
    </main>
  );
}
