import { cn } from "@/lib/utils/cn";

type ProgressTone = "accent" | "warning" | "danger";

const tones: Record<ProgressTone, string> = {
  accent: "bg-teal-400",
  warning: "bg-amber-400",
  danger: "bg-rose-500",
};

/** Single progress bar style used by budgets, goals and bills. */
export function Progress({
  value,
  tone = "accent",
  className,
}: {
  value: number;
  tone?: ProgressTone;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn("h-2.5 w-full overflow-hidden rounded-full border-2 border-black bg-zinc-950", className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-500", tones[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
