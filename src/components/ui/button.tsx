import { cn } from "@/lib/utils/cn";
import { forwardRef, type ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const base =
  "inline-flex items-center justify-center gap-1.5 font-semibold whitespace-nowrap select-none cursor-pointer " +
  "transition-[transform,box-shadow,background-color,color] duration-150 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 " +
  "disabled:opacity-50 disabled:pointer-events-none";

const solid =
  "border-2 border-black shadow-nb-sm active:translate-x-px active:translate-y-px active:shadow-none";

const variants: Record<ButtonVariant, string> = {
  primary: `${solid} bg-teal-400 text-black hover:bg-teal-300`,
  secondary: `${solid} bg-zinc-800 text-zinc-100 hover:bg-zinc-700`,
  danger: `${solid} bg-rose-500 text-black hover:bg-rose-400`,
  ghost: "border-2 border-transparent bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs rounded-lg",
  md: "h-10 px-4 text-sm rounded-xl",
  lg: "h-12 px-5 text-sm rounded-xl",
  icon: "h-8 w-8 p-0 rounded-lg",
};

/** Class helper so links (`<Link>`) can look exactly like buttons without nesting `<button>` in `<a>`. */
export function buttonVariants({
  variant = "primary",
  size = "md",
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={buttonVariants({ variant, size, className })}
      {...props}
    />
  )
);

Button.displayName = "Button";
