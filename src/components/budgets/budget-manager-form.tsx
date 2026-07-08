"use client";

import { useState, useTransition } from "react";
import { upsertBudgetAction, deleteBudgetAction } from "@/actions/budget.actions";
import { formatRupiah, formatRupiahInput, parseRupiahInput } from "@/lib/utils/currency";
import { useVisibility } from "@/components/providers/visibility-provider";
import type { Category } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Trash2, ShieldCheck, AlertCircle } from "lucide-react";

interface BudgetManagerFormProps {
  categories: Category[];
  initialBudgets: any[];
}

export function BudgetManagerForm({ categories, initialBudgets }: BudgetManagerFormProps) {
  const { mask } = useVisibility();
  const [budgets, setBudgets] = useState<any[]>(initialBudgets);
  const [selectedCatId, setSelectedCatId] = useState("");
  const [amountDisplay, setAmountDisplay] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleUpsert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCatId) {
      setError("Pilih kategori terlebih dahulu.");
      return;
    }

    const amount = parseRupiahInput(amountDisplay);
    if (amount <= 0) {
      setError("Limit anggaran harus lebih dari Rp 0.");
      return;
    }

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const res = await upsertBudgetAction(selectedCatId, amount);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess("Limit anggaran berhasil disimpan!");
        setAmountDisplay("");
        
        // Optimistically update list local state
        const matchedCat = categories.find((c) => c.id === selectedCatId);
        setBudgets((prev) => {
          const filtered = prev.filter((b) => b.category_id !== selectedCatId);
          return [
            ...filtered,
            {
              category_id: selectedCatId,
              amount,
              category: { name: matchedCat?.name ?? "Kategori" },
            },
          ];
        });
      }
    });
  };

  const handleDelete = async (id: string, catId: string) => {
    if (!confirm("Hapus limit anggaran untuk kategori ini?")) return;

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      let res;
      if (id) {
        res = await deleteBudgetAction(id);
      } else {
        // Fallback local deletion if id is temporary
        res = { success: true, error: undefined };
      }

      if (res.error) {
        setError(res.error);
      } else {
        setSuccess("Limit anggaran berhasil dihapus.");
        setBudgets((prev) => prev.filter((b) => b.category_id !== catId));
      }
    });
  };

  return (
    <div className="grid gap-6 md:grid-cols-5">
      {/* Set limit form card */}
      <Card className="border-2 border-black bg-zinc-900 p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] md:col-span-2 space-y-4 self-start">
        <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider border-b-2 border-black pb-2">
          Set Limit Anggaran
        </h3>

        {error && (
          <div className="flex items-center gap-1.5 p-3 rounded-lg bg-zinc-950 border-2 border-red-500/30 text-red-400 text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-1.5 p-3 rounded-lg bg-zinc-950 border-2 border-teal-500/30 text-teal-400 text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce-short">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleUpsert} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="category_id">Kategori Pengeluaran</Label>
            <Select
              id="category_id"
              value={selectedCatId}
              onChange={(e) => setSelectedCatId(e.target.value)}
              required
            >
              <option value="" disabled>
                Pilih kategori
              </option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="budget_amount">Batas Anggaran Bulanan</Label>
            <Input
              id="budget_amount"
              inputMode="numeric"
              placeholder="Rp 0"
              value={amountDisplay}
              onChange={(e) => setAmountDisplay(formatRupiahInput(parseRupiahInput(e.target.value)))}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-teal-400 hover:bg-teal-300 text-black border-2 border-black shadow-[2px_2px_0px_0px_#000] font-black h-11 rounded-xl"
            disabled={isPending}
          >
            {isPending ? "Menyimpan..." : "Simpan Batas Anggaran"}
          </Button>
        </form>
      </Card>

      {/* Budgets List */}
      <div className="md:col-span-3 space-y-3">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-1">
          Daftar Limit Aktif
        </h3>

        {budgets.length === 0 ? (
          <Card className="border-2 border-black bg-zinc-900 p-6 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-center text-zinc-500 text-xs font-bold">
            Belum ada limit anggaran bulanan yang disetel.
          </Card>
        ) : (
          <div className="space-y-3">
            {budgets.map((b) => (
              <Card
                key={b.category_id}
                className="p-4 border-2 border-black bg-zinc-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between gap-3"
              >
                <div>
                  <p className="font-bold text-zinc-100">{b.category?.name}</p>
                  <p className="text-xs text-zinc-400 font-medium mt-0.5">
                    Limit bulanan: <span className="text-teal-400 font-extrabold">{mask(b.amount)}</span>
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 border border-transparent hover:border-red-500/30 text-zinc-500 hover:text-red-400 hover:bg-rose-950/20"
                  onClick={() => handleDelete(b.id, b.category_id)}
                  disabled={isPending}
                  aria-label="Hapus limit"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
