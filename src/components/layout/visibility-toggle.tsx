"use client";

import { Eye, EyeOff } from "lucide-react";
import { useVisibility } from "@/components/providers/visibility-provider";

export function VisibilityToggle() {
  const { isVisible, toggleVisibility } = useVisibility();
  const label = isVisible ? "Sembunyikan saldo" : "Tampilkan saldo";

  return (
    <button
      type="button"
      onClick={toggleVisibility}
      title={label}
      aria-label={label}
      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border-2 border-black bg-zinc-800 text-zinc-300 shadow-nb-sm transition-[transform,box-shadow,color] hover:text-teal-400 active:translate-x-px active:translate-y-px active:shadow-none"
    >
      {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
    </button>
  );
}
