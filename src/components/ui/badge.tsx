import { cn } from "@/lib/utils/cn";
import type { HTMLAttributes } from "react";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

/** Soft, low-noise badges. Solid fills are reserved for buttons. */
const variants: Record<BadgeVariant, string> = {
  default: "bg-zinc-800 text-zinc-300 ring-zinc-700",
  success: "bg-teal-400/10 text-teal-300 ring-teal-400/30",
  warning: "bg-amber-400/10 text-amber-300 ring-amber-400/30",
  danger: "bg-rose-500/10 text-rose-300 ring-rose-500/30",
  info: "bg-sky-400/10 text-sky-300 ring-sky-400/30",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
