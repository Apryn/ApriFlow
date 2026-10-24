"use client";

import { useState, useTransition } from "react";
import { upsertBudgetAction, deleteBudgetAction } from "@/actions/budget.actions";
import { formatRupiahInput, parseRupiahInput } from "@/lib/utils/currency";
import { useVisibility } from "@/components/providers/visibility-provider";
import type { Category } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card, CardHeader } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Trash2 } from "lucide-react";

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
    <div className="grid gap-5 md:grid-cols-5">
      <Card className="space-y-4 md:col-span-2 self-start">
        <CardHeader title="Set Batas Anggaran" />

        {error && <Alert variant="error">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <form onSubmit={handleUpsert} className="space-y-3.5">
          <div>
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

          <div>
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
            className="w-full mt-2"
            disabled={isPending}
          >
            {isPending ? "Menyimpan..." : "Simpan Batas Anggaran"}
          </Button>
        </form>
      </Card>

      <div className="md:col-span-3 space-y-3">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-1">
          Daftar Limit Aktif
        </h3>

        {budgets.length === 0 ? (
          <Card className="text-center text-zinc-500 text-xs py-8">
            Belum ada limit anggaran bulanan yang disetel.
          </Card>
        ) : (
          <div className="space-y-2.5">
            {budgets.map((b) => (
              <Card
                key={b.category_id}
                className="p-3.5 flex items-center justify-between gap-3"
              >
                <div>
                  <p className="font-semibold text-sm text-zinc-100">{b.category?.name}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Limit bulanan: <span className="tabular text-teal-400 font-bold">{mask(b.amount)}</span>
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-zinc-500 hover:text-rose-400"
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
