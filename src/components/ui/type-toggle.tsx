"use client";

import { cn } from "@/lib/utils/cn";

export type TxType = "income" | "expense";

/** Expense / Income toggle, used by every transaction form. Renders a hidden radio so it works in plain <form>s. */
export function TypeToggle({
  value,
  onChange,
  name = "type",
}: {
  value: TxType;
  onChange: (v: TxType) => void;
  name?: string;
}) {
  const options: { v: TxType; label: string; active: string }[] = [
    { v: "expense", label: "Pengeluaran", active: "bg-rose-500 text-black" },
    { v: "income", label: "Pemasukan", active: "bg-teal-400 text-black" },
  ];

  return (
    <div className="grid grid-cols-2 gap-1 rounded-xl border-2 border-black bg-zinc-950 p-1">
      {options.map((o) => {
        const isActive = value === o.v;
        return (
          <label
            key={o.v}
            className={cn(
              "flex h-9 cursor-pointer items-center justify-center rounded-lg text-sm font-semibold transition-colors",
              isActive ? `${o.active} shadow-nb-sm` : "text-zinc-400 hover:text-zinc-100"
            )}
          >
            <input
              type="radio"
              name={name}
              value={o.v}
              checked={isActive}
              onChange={() => onChange(o.v)}
              className="sr-only"
            />
            {o.label}
          </label>
        );
      })}
    </div>
  );
}
