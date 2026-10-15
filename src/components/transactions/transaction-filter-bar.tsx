"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Calendar, X } from "lucide-react";

export function TransactionFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Local state initialized from URL
  const [query, setQuery] = useState(searchParams.get("query") ?? "");
  const [startDate, setStartDate] = useState(searchParams.get("start_date") ?? "");
  const [endDate, setEndDate] = useState(searchParams.get("end_date") ?? "");

  // Sync with URL params changes (e.g. if cleared externally)
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

    if (query.trim()) {
      params.set("query", query.trim());
    } else {
      params.delete("query");
    }

    if (startDate) {
      params.set("start_date", startDate);
    } else {
      params.delete("start_date");
    }

    if (endDate) {
      params.set("end_date", endDate);
    } else {
      params.delete("end_date");
    }

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
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleTypeSelect(null)}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all border-2 border-black cursor-pointer ${
            !activeType
              ? "bg-zinc-100 text-black shadow-[2px_2px_0px_0px_#2dd4bf]"
              : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          }`}
        >
          Semua
        </button>
        <button
          type="button"
          onClick={() => handleTypeSelect("income")}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all border-2 border-black cursor-pointer ${
            activeType === "income"
              ? "bg-teal-400 text-black shadow-[2px_2px_0px_0px_#000]"
              : "bg-zinc-900 text-teal-400 hover:bg-zinc-850 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          }`}
        >
          Pemasukan
        </button>
        <button
          type="button"
          onClick={() => handleTypeSelect("expense")}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all border-2 border-black cursor-pointer ${
            activeType === "expense"
              ? "bg-rose-500 text-white shadow-[2px_2px_0px_0px_#000]"
              : "bg-zinc-900 text-rose-400 hover:bg-zinc-850 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          }`}
        >
          Pengeluaran
        </button>
      </div>

      <form onSubmit={handleSearch} className="space-y-3 bg-zinc-900 border-2 border-black p-3.5 rounded-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex flex-col sm:flex-row gap-2.5">
        {/* Text Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari transaksi..."
            className="pl-9 bg-zinc-950 border-2 border-black"
          />
        </div>

        {/* Date Filters */}
        <div className="flex gap-2 items-center flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-1.5 bg-zinc-950 border-2 border-black rounded-xl px-2.5 py-1">
            <Calendar className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-xs text-zinc-200 focus:outline-none cursor-pointer"
            />
          </div>
          <span className="text-zinc-500 text-xs font-bold font-mono">s/d</span>
          <div className="flex items-center gap-1.5 bg-zinc-950 border-2 border-black rounded-xl px-2.5 py-1">
            <Calendar className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-xs text-zinc-200 focus:outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 pt-1">
        {hasActiveFilters && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleClear}
            className="bg-zinc-800 text-zinc-300 border-2 border-black hover:bg-zinc-700 shadow-[1.5px_1.5px_0px_0px_#000] text-xs font-bold flex items-center gap-1 px-3.5"
          >
            <X className="h-3.5 w-3.5" />
            Reset
          </Button>
        )}
        <Button
          type="submit"
          size="sm"
          className="bg-teal-400 hover:bg-teal-300 text-black border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000] text-xs font-extrabold px-5 h-8"
        >
          Cari
        </Button>
      </div>
    </form>
    </div>
  );
}
