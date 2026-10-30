import { Icon, type IconName } from "./Icon";

const SIZES = {
  sm: { box: "size-10", icon: "size-[18px]" },
  md: { box: "size-14", icon: "size-5" },
  lg: { box: "size-20", icon: "size-7" },
};

type Props = {
  icon: IconName;
  label: string;
  onClick: () => void;
  size?: keyof typeof SIZES;
  active?: boolean;
  disabled?: boolean;
  caption?: string;
};

export function RoundButton({ icon, label, onClick, size = "sm", active, disabled, caption }: Props) {
  const tone = active
    ? "bg-fg text-bg border-fg"
    : size === "lg"
      ? "bg-[radial-gradient(circle_at_30%_25%,#2c2c33,var(--color-surface-2))] text-fg border-white/15 shadow-[0_10px_40px_rgb(255_255_255/0.06)]"
      : "bg-surface text-fg border-line hover:bg-surface-2";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        title={label}
        className={`${SIZES[size].box} ${tone} grid place-items-center rounded-full border transition active:scale-95 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg`}
      >
        <Icon name={icon} className={SIZES[size].icon} />
      </button>
      {caption && <span className="text-[11px] text-muted">{caption}</span>}
    </div>
  );
}
