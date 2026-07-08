"use client";

import { Eye, EyeOff } from "lucide-react";
import { useVisibility } from "@/components/providers/visibility-provider";

export function VisibilityToggle() {
  const { isVisible, toggleVisibility } = useVisibility();

  return (
    <button
      onClick={toggleVisibility}
      className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-black bg-zinc-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-zinc-400 hover:text-teal-400 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all duration-150 cursor-pointer"
      title={isVisible ? "Sembunyikan Saldo" : "Tampilkan Saldo"}
      aria-label={isVisible ? "Sembunyikan Saldo" : "Tampilkan Saldo"}
    >
      {isVisible ? (
        <Eye className="h-4 w-4 animate-in fade-in zoom-in-75 duration-200" />
      ) : (
        <EyeOff className="h-4 w-4 animate-in fade-in zoom-in-75 duration-200" />
      )}
    </button>
  );
}
