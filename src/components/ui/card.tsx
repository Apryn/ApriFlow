import { cn } from "@/lib/utils/cn";
import Link from "next/link";
import type { HTMLAttributes, ReactNode } from "react";

/** Base surface. All cards share one border + one black shadow. */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-2xl border-2 border-black bg-surface p-4 shadow-nb", className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-[11px] font-semibold uppercase tracking-wider text-zinc-400", className)}
      {...props}
    />
  );
}

export function CardValue({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("tabular mt-1 text-xl font-bold tracking-tight text-zinc-50 md:text-2xl", className)}
      {...props}
    />
  );
}

/** Consistent card header: title on the left, optional link/action on the right. */
export function CardHeader({
  title,
  href,
  linkLabel = "Lihat semua",
  action,
  className,
}: {
  title: ReactNode;
  href?: string;
  linkLabel?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex items-center justify-between gap-2", className)}>
      <CardTitle>{title}</CardTitle>
      {action ??
        (href && (
          <Link
            href={href}
            className="text-xs font-semibold text-teal-400 transition-colors hover:text-teal-300"
          >
            {linkLabel}
          </Link>
        ))}
    </div>
  );
}

/** Section title used outside of cards (e.g. above a list). */
export function SectionTitle({
  children,
  action,
  className,
}: {
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-2 flex items-center justify-between gap-2 px-1", className)}>
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">{children}</h2>
      {action}
    </div>
  );
}
