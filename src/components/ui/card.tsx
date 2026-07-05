import { cn } from "@/lib/utils/cn";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-2xl bg-zinc-900 p-4 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]", className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-400", className)} {...props} />;
}

export function CardValue({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("mt-1.5 text-lg sm:text-xl md:text-2xl font-black text-zinc-50 tracking-tight", className)} {...props} />;
}
