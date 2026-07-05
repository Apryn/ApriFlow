import { cn } from "@/lib/utils/cn";
import { forwardRef, type InputHTMLAttributes } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-xl border-2 border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-100",
        "placeholder:text-zinc-600 focus:border-teal-400 focus:outline-none transition-all focus:shadow-[2px_2px_0px_0px_#000]",
        className
      )}
      {...props}
    />
  )
);

Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full rounded-xl border-2 border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-100",
      "placeholder:text-zinc-600 focus:border-teal-400 focus:outline-none transition-all focus:shadow-[2px_2px_0px_0px_#000]",
      "min-h-[80px] resize-y",
      className
    )}
    {...props}
  />
));

Textarea.displayName = "Textarea";

export const Label = forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label ref={ref} className={cn("mb-1.5 block text-sm font-bold text-zinc-300", className)} {...props} />
  )
);

Label.displayName = "Label";

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "w-full rounded-xl border-2 border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-100",
        "focus:border-teal-400 focus:outline-none transition-all focus:shadow-[2px_2px_0px_0px_#000]",
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
);

Select.displayName = "Select";
