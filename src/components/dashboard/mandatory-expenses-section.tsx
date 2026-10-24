"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Progress } from "@/components/ui/progress";
import { Alert } from "@/components/ui/alert";
import { useVisibility } from "@/components/providers/visibility-provider";
import { formatRupiah, formatRupiahInput, parseRupiahInput } from "@/lib/utils/currency";
import type { MandatoryExpense } from "@/types/database.types";
import {
  addMandatoryExpenseAction,
  updateMandatoryExpenseAction,
  deleteMandatoryExpenseAction,
  toggleMandatoryExpensePaidAction,
} from "@/actions/mandatory-expense.actions";
import {
  CheckCircle2,
  Circle,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";

interface MandatoryExpensesSectionProps {
  initialItems: MandatoryExpense[];
  year: number;
  month: number;
}

const DEFAULT_SUGGESTIONS = [
  { name: "WiFi / Internet", amount: 350000, dueDay: 20 },
  { name: "Listrik PLN", amount: 250000, dueDay: 15 },
  { name: "Uang Kos / Sewa", amount: 900000, dueDay: 1 },
  { name: "BPJS Kesehatan", amount: 150000, dueDay: 10 },
];

export function MandatoryExpensesSection({
  initialItems,
  year,
  month,
}: MandatoryExpensesSectionProps) {
  const router = useRouter();
  const { mask } = useVisibility();
  const [items, setItems] = useState<MandatoryExpense[]>(initialItems);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MandatoryExpense | null>(null);
  const [formName, setFormName] = useState("");
  const [formAmountStr, setFormAmountStr] = useState("");
  const [formDueDay, setFormDueDay] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const monthKey = `${year}-${String(month).padStart(2, "0")}`;

  const totalAmount = items.reduce((sum, it) => sum + it.amount, 0);
  const paidItems = items.filter((it) => it.paid_months?.includes(monthKey));
  const paidAmount = paidItems.reduce((sum, it) => sum + it.amount, 0);
  const percentage = items.length > 0 ? Math.round((paidItems.length / items.length) * 100) : 0;

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormName("");
    setFormAmountStr("");
    setFormDueDay("");
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: MandatoryExpense) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormAmountStr(formatRupiahInput(item.amount));
    setFormDueDay(item.due_day ? String(item.due_day) : "");
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleAddSuggestion = (sug: typeof DEFAULT_SUGGESTIONS[0]) => {
    setEditingItem(null);
    setFormName(sug.name);
    setFormAmountStr(formatRupiahInput(sug.amount));
    setFormDueDay(sug.dueDay ? String(sug.dueDay) : "");
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleToggle = (item: MandatoryExpense) => {
    const isCurrentlyPaid = item.paid_months?.includes(monthKey);
    const newPaidMonths = isCurrentlyPaid
      ? (item.paid_months || []).filter((m) => m !== monthKey)
      : [...(item.paid_months || []), monthKey];

    setItems((prev) =>
      prev.map((it) => (it.id === item.id ? { ...it, paid_months: newPaidMonths } : it))
    );

    startTransition(async () => {
      const res = await toggleMandatoryExpensePaidAction(item.id, year, month);
      if (!res.success) {
        setItems((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, paid_months: item.paid_months } : it))
        );
      } else {
        router.refresh();
      }
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Hapus pengeluaran wajib "${name}"?`)) return;

    setItems((prev) => prev.filter((it) => it.id !== id));
    startTransition(async () => {
      await deleteMandatoryExpenseAction(id);
      router.refresh();
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const amount = parseRupiahInput(formAmountStr);
    const dueDayNum = formDueDay ? parseInt(formDueDay, 10) : null;

    if (!formName.trim()) {
      setFormError("Nama pengeluaran wajib diisi.");
      return;
    }
    if (amount <= 0) {
      setFormError("Nominal harus lebih besar dari Rp 0.");
      return;
    }
    if (dueDayNum !== null && (dueDayNum < 1 || dueDayNum > 31)) {
      setFormError("Tanggal jatuh tempo harus antara 1 sampai 31.");
      return;
    }

    startTransition(async () => {
      if (editingItem) {
        const res = await updateMandatoryExpenseAction(
          editingItem.id,
          formName.trim(),
          amount,
          dueDayNum
        );
        if (res.error) {
          setFormError(res.error);
        } else {
          setItems((prev) =>
            prev.map((it) =>
              it.id === editingItem.id
                ? {
                    ...it,
                    name: formName.trim(),
                    amount,
                    due_day: dueDayNum,
                    updated_at: new Date().toISOString(),
                  }
                : it
            )
          );
          setIsModalOpen(false);
          router.refresh();
        }
      } else {
        const res = await addMandatoryExpenseAction(formName.trim(), amount, dueDayNum);
        if (res.error) {
          setFormError(res.error);
        } else {
          const newItem: MandatoryExpense = {
            id: crypto.randomUUID(),
            name: formName.trim(),
            amount,
            due_day: dueDayNum,
            paid_months: [],
            paid_transaction_ids: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setItems((prev) => [...prev, newItem]);
          setIsModalOpen(false);
          router.refresh();
        }
      }
    });
  };

  return (
    <>
      <Card className="space-y-3.5">
        <CardHeader
          title="Tagihan & Pengeluaran Wajib"
          action={
            <Button size="sm" onClick={handleOpenAdd}>
              <Plus className="h-3.5 w-3.5" />
              Tambah Pos
            </Button>
          }
        />

        {items.length > 0 && (
          <div className="space-y-2 rounded-xl bg-surface-2 p-3 border border-zinc-800">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-zinc-300">
                {paidItems.length} dari {items.length} lunas ({percentage}%)
              </span>
              <span className="tabular text-zinc-400">
                <span className="text-teal-400">{mask(paidAmount)}</span> / {mask(totalAmount)}
              </span>
            </div>
            <Progress value={percentage} tone="warning" />
          </div>
        )}

        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 p-4 text-center">
            <p className="text-xs text-zinc-400">
              Belum ada tagihan rutin bulanan (WiFi, kos, listrik, asuransi).
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
              {DEFAULT_SUGGESTIONS.map((sug) => (
                <button
                  key={sug.name}
                  type="button"
                  onClick={() => handleAddSuggestion(sug)}
                  className="cursor-pointer rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-200 transition-colors hover:border-teal-400 hover:text-teal-400"
                >
                  + {sug.name} ({formatRupiah(sug.amount)})
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {items.map((item) => {
              const isPaid = item.paid_months?.includes(monthKey);
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <div
                    onClick={() => handleToggle(item)}
                    className="flex flex-1 cursor-pointer select-none items-center gap-3 min-w-0"
                  >
                    <button
                      type="button"
                      aria-label={isPaid ? "Tandai belum lunas" : "Tandai lunas"}
                      className="shrink-0 cursor-pointer"
                    >
                      {isPaid ? (
                        <CheckCircle2 className="h-5 w-5 text-teal-400" />
                      ) : (
                        <Circle className="h-5 w-5 text-zinc-600 hover:text-zinc-400" />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`truncate text-sm font-semibold ${
                            isPaid ? "text-zinc-500 line-through" : "text-zinc-100"
                          }`}
                        >
                          {item.name}
                        </span>
                        {item.due_day && (
                          <Badge variant="default" className="text-[10px]">
                            Tgl {item.due_day}
                          </Badge>
                        )}
                      </div>
                      <p
                        className={`tabular text-xs font-medium ${
                          isPaid ? "text-zinc-600 line-through" : "text-zinc-400"
                        }`}
                      >
                        {mask(item.amount)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEdit(item)}
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(item.id, item.name)}
                      className="hover:text-rose-400"
                      title="Hapus"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? "Ubah Pengeluaran Wajib" : "Tambah Pengeluaran Wajib"}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button
              type="submit"
              form="mandatory-form"
              size="sm"
              disabled={isPending}
            >
              {isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </>
        }
      >
        <form id="mandatory-form" onSubmit={handleSubmit} className="space-y-3.5">
          {formError && <Alert variant="error">{formError}</Alert>}

          <div>
            <Label htmlFor="m-name">Nama Pos</Label>
            <Input
              id="m-name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Contoh: WiFi Indihome, Kos, Listrik"
              required
            />
          </div>

          <div>
            <Label htmlFor="m-amount">Nominal Bulanan (Rp)</Label>
            <Input
              id="m-amount"
              inputMode="numeric"
              value={formAmountStr}
              onChange={(e) => {
                const num = parseRupiahInput(e.target.value);
                setFormAmountStr(formatRupiahInput(num));
              }}
              placeholder="Rp 350.000"
              required
            />
          </div>

          <div>
            <Label htmlFor="m-dueday">Tanggal Jatuh Tempo (Opsional)</Label>
            <Input
              id="m-dueday"
              type="number"
              min="1"
              max="31"
              value={formDueDay}
              onChange={(e) => setFormDueDay(e.target.value)}
              placeholder="Contoh: 10"
            />
            <p className="mt-1 text-[11px] text-zinc-500">
              Kosongkan jika tidak ada tanggal jatuh tempo tertentu.
            </p>
          </div>
        </form>
      </Modal>
    </>
  );
}
