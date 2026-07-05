import { cn } from "@/lib/utils/cn";
import type { HTMLAttributes } from "react";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

const variants: Record<BadgeVariant, string> = {
  default: "bg-zinc-800 text-zinc-100 border border-zinc-700",
  success: "bg-teal-400 text-black border border-black",
  warning: "bg-amber-400 text-black border border-black",
  danger: "bg-red-500 text-black border border-black",
  info: "bg-blue-400 text-black border border-black",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold shrink-0 shadow-[1px_1px_0px_0px_#000]",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
