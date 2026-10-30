import { Icon, type IconName } from "./Icon";

const SIZES = {
  sm: { box: "size-10", icon: "size-[18px]" },
  md: { box: "size-12", icon: "size-5" },
};

const TONES = {
  default: "bg-surface text-fg border-line hover:bg-surface-2",
  solid: "bg-fg text-bg border-fg hover:bg-white",
  danger: "bg-rec text-white border-rec",
  ghost: "bg-transparent text-fg border-transparent hover:bg-surface-2",
};

type Props = {
  icon: IconName;
  label: string;
  onClick: () => void;
  size?: keyof typeof SIZES;
  tone?: keyof typeof TONES;
  disabled?: boolean;
};

export function RoundButton({ icon, label, onClick, size = "sm", tone = "default", disabled }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`${SIZES[size].box} ${TONES[tone]} grid shrink-0 place-items-center rounded-full border transition active:scale-95 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg`}
    >
      <Icon name={icon} className={SIZES[size].icon} />
    </button>
  );
}
