"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

export function TransactionFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("query") ?? "");
  const [startDate, setStartDate] = useState(searchParams.get("start_date") ?? "");
  const [endDate, setEndDate] = useState(searchParams.get("end_date") ?? "");

  useEffect(() => {
    setQuery(searchParams.get("query") ?? "");
    setStartDate(searchParams.get("start_date") ?? "");
    setEndDate(searchParams.get("end_date") ?? "");
  }, [searchParams]);

  const activeType = searchParams.get("type");

  const handleTypeSelect = (typeVal: "income" | "expense" | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (typeVal) {
      params.set("type", typeVal);
    } else {
      params.delete("type");
    }
    router.push(`/transaksi?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());

    if (query.trim()) params.set("query", query.trim());
    else params.delete("query");

    if (startDate) params.set("start_date", startDate);
    else params.delete("start_date");

    if (endDate) params.set("end_date", endDate);
    else params.delete("end_date");

    router.push(`/transaksi?${params.toString()}`);
  };

  const handleClear = () => {
    setQuery("");
    setStartDate("");
    setEndDate("");
    router.push("/transaksi");
  };

  const hasActiveFilters =
    searchParams.has("query") ||
    searchParams.has("start_date") ||
    searchParams.has("end_date") ||
    searchParams.has("category") ||
    searchParams.has("type");

  return (
    <div className="space-y-3">
      {/* Quick Type Filter Tabs */}
      <div className="flex items-center gap-1.5">
        {[
          { label: "Semua", val: null },
          { label: "Pemasukan", val: "income" as const },
          { label: "Pengeluaran", val: "expense" as const },
        ].map((item) => {
          const isActive = activeType === item.val;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => handleTypeSelect(item.val)}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-all border-2 border-black ${
                isActive
                  ? item.val === "expense"
                    ? "bg-rose-500 text-black shadow-nb-sm"
                    : "bg-teal-400 text-black shadow-nb-sm"
                  : "bg-surface text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <form
        onSubmit={handleSearch}
        className="space-y-2.5 rounded-2xl border-2 border-black bg-surface p-3 shadow-nb"
      >
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari transaksi..."
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-10 rounded-xl border-2 border-zinc-800 bg-surface-2 px-2.5 text-xs text-zinc-200 focus:border-teal-400 focus:outline-none"
            />
            <span className="text-xs text-zinc-600">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-10 rounded-xl border-2 border-zinc-800 bg-surface-2 px-2.5 text-xs text-zinc-200 focus:border-teal-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
            >
              <X className="h-3.5 w-3.5" />
              Reset
            </Button>
          )}
          <Button type="submit" size="sm">
            Cari
          </Button>
        </div>
      </form>
    </div>
  );
}
