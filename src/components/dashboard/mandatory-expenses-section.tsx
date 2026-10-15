"use client";

import { useState, useTransition } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useVisibility } from "@/components/providers/visibility-provider";
import { formatRupiah, formatRupiahInput, parseRupiahInput } from "@/lib/utils/currency";
import { formatMonthYear } from "@/lib/utils/date";
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
  PlusCircle,
  Pencil,
  Trash2,
  CalendarClock,
  Sparkles,
  X,
  AlertCircle,
  RotateCcw,
  ReceiptText,
} from "lucide-react";

interface MandatoryExpensesSectionProps {
  initialItems: MandatoryExpense[];
  year: number;
  month: number;
}

const DEFAULT_SUGGESTIONS = [
  { name: "WiFi Indihome", amount: 350000, dueDay: 20 },
  { name: "Uang Kuliah / SPP", amount: 1500000, dueDay: 10 },
  { name: "Listrik PLN", amount: 250000, dueDay: 15 },
  { name: "Uang Kos", amount: 900000, dueDay: 1 },
  { name: "BPJS Kesehatan", amount: 150000, dueDay: 10 },
];

export function MandatoryExpensesSection({
  initialItems,
  year,
  month,
}: MandatoryExpensesSectionProps) {
  const { mask } = useVisibility();
  const [items, setItems] = useState<MandatoryExpense[]>(initialItems);
  const [isPending, startTransition] = useTransition();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MandatoryExpense | null>(null);
  const [formName, setFormName] = useState("");
  const [formAmountStr, setFormAmountStr] = useState("");
  const [formDueDay, setFormDueDay] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const monthKey = `${year}-${String(month).padStart(2, "0")}`;
  const monthLabel = formatMonthYear(year, month);

  // Sync state if initialItems changes externally
  // Calculate summary metrics
  const totalAmount = items.reduce((sum, it) => sum + it.amount, 0);
  const paidItems = items.filter((it) => it.paid_months?.includes(monthKey));
  const paidAmount = paidItems.reduce((sum, it) => sum + it.amount, 0);
  const remainingAmount = Math.max(0, totalAmount - paidAmount);
  const percentage = items.length > 0 ? Math.round((paidItems.length / items.length) * 100) : 0;

  // Open modal for Adding
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormName("");
    setFormAmountStr("");
    setFormDueDay("");
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open modal for Editing
  const handleOpenEdit = (item: MandatoryExpense) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormAmountStr(formatRupiahInput(item.amount));
    setFormDueDay(item.due_day ? String(item.due_day) : "");
    setFormError(null);
    setIsModalOpen(true);
  };

  // Quick add suggestion
  const handleAddSuggestion = (sug: typeof DEFAULT_SUGGESTIONS[0]) => {
    setEditingItem(null);
    setFormName(sug.name);
    setFormAmountStr(formatRupiahInput(sug.amount));
    setFormDueDay(sug.dueDay ? String(sug.dueDay) : "");
    setFormError(null);
    setIsModalOpen(true);
  };

  // Toggle check/uncheck for current month with optimistic update
  const handleToggle = (item: MandatoryExpense) => {
    const isCurrentlyPaid = item.paid_months?.includes(monthKey);
    const newPaidMonths = isCurrentlyPaid
      ? (item.paid_months || []).filter((m) => m !== monthKey)
      : [...(item.paid_months || []), monthKey];

    // Optimistic UI update
    setItems((prev) =>
      prev.map((it) => (it.id === item.id ? { ...it, paid_months: newPaidMonths } : it))
    );

    startTransition(async () => {
      const res = await toggleMandatoryExpensePaidAction(item.id, year, month);
      if (!res.success) {
        // Rollback on failure
        setItems((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, paid_months: item.paid_months } : it))
        );
      }
    });
  };

  // Delete item
  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Hapus pengeluaran wajib "${name}"?`)) return;

    setItems((prev) => prev.filter((it) => it.id !== id));
    startTransition(async () => {
      await deleteMandatoryExpenseAction(id);
    });
  };

  // Submit Add / Edit Form
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
        // Update
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
        }
      } else {
        // Add
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
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setItems((prev) => [...prev, newItem]);
          setIsModalOpen(false);
        }
      }
    });
  };

  return (
    <Card className="mt-4 border-2 border-black bg-zinc-900 p-4 sm:p-5 shadow-[3px_3px_0px_0px_#f59e0b]">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 border-2 border-amber-400 text-amber-400 shadow-[1.5px_1.5px_0px_0px_#000]">
            <CalendarClock className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-zinc-100 uppercase tracking-wide">
                Pengeluaran Wajib
              </h2>
              <Badge variant="warning" className="text-[10px] py-0 px-1.5 font-bold">
                {monthLabel}
              </Badge>
            </div>
            <p className="text-[11px] text-zinc-400">
              Checklist tagihan bulanan (otomatis reset tiap bulan baru)
            </p>
          </div>
        </div>

        <Button
          size="sm"
          onClick={handleOpenAdd}
          className="bg-amber-400 hover:bg-amber-300 text-black border-2 border-black shadow-[2px_2px_0px_0px_#000] text-xs font-black flex items-center gap-1.5 h-8 px-3"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          Atur Pos Wajib
        </Button>
      </div>

      {/* Progress & Summary Bar */}
      {items.length > 0 && (
        <div className="mt-4 p-3 rounded-xl bg-zinc-950 border-2 border-black shadow-[2px_2px_0px_0px_#000] space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold flex-wrap gap-1">
            <span className="text-zinc-300">
              Progres:{" "}
              <strong className="text-amber-400 font-black">
                {paidItems.length} dari {items.length}
              </strong>{" "}
              Lunas ({percentage}%)
            </span>
            <span className="text-zinc-400">
              Total: <strong className="text-zinc-100">{mask(totalAmount)}</strong>
            </span>
          </div>

          {/* Neo-brutalist Progress Track */}
          <div className="h-3 w-full bg-zinc-900 rounded-full border border-black overflow-hidden relative">
            <div
              className="h-full bg-amber-400 transition-all duration-300 rounded-full border-r border-black"
              style={{ width: `${percentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400 pt-0.5">
            <span className="text-teal-400">
              Sudah dibayar: {mask(paidAmount)}
            </span>
            <span className={remainingAmount > 0 ? "text-rose-400" : "text-teal-400"}>
              {remainingAmount > 0 ? `Sisa: ${mask(remainingAmount)}` : "Semua Lunas! 🎉"}
            </span>
          </div>
        </div>
      )}

      {/* Items Checklist */}
      {items.length === 0 ? (
        <div className="mt-4 rounded-xl border-2 border-dashed border-zinc-800 bg-zinc-950/60 p-5 text-center space-y-3">
          <p className="text-xs text-zinc-400 font-bold leading-relaxed">
            Belum ada pos pengeluaran wajib bulanan. Tambahkan pengeluaran rutin Anda seperti WiFi,
            uang kuliah, kos, atau listrik agar mudah dipantau tiap bulan.
          </p>

          <div className="pt-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-400 mb-2">
              Saran Cepat 1-Klik:
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {DEFAULT_SUGGESTIONS.map((sug) => (
                <button
                  key={sug.name}
                  type="button"
                  onClick={() => handleAddSuggestion(sug)}
                  className="text-xs font-extrabold bg-zinc-900 hover:bg-zinc-850 text-zinc-200 border-2 border-black shadow-[2px_2px_0px_0px_#000] px-2.5 py-1 rounded-lg transition-all hover:scale-[1.02] cursor-pointer"
                >
                  + {sug.name} ({formatRupiah(sug.amount)})
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {items.map((item) => {
            const isPaid = item.paid_months?.includes(monthKey);
            return (
              <div
                key={item.id}
                className={`group flex items-center justify-between gap-3 p-3 rounded-xl border-2 border-black transition-all ${
                  isPaid
                    ? "bg-zinc-950/70 border-zinc-800 opacity-80 shadow-[1.5px_1.5px_0px_0px_#000]"
                    : "bg-zinc-950 border-black shadow-[2.5px_2.5px_0px_0px_#f59e0b] hover:-translate-y-[0.5px]"
                }`}
              >
                {/* Left: Checkbox + Name + Due Date */}
                <div
                  onClick={() => handleToggle(item)}
                  className="flex items-center gap-3 cursor-pointer flex-1 select-none min-w-0"
                >
                  <button
                    type="button"
                    aria-label={isPaid ? "Tandai belum bayar" : "Tandai sudah bayar"}
                    className="shrink-0 transition-transform active:scale-90"
                  >
                    {isPaid ? (
                      <CheckCircle2 className="h-6 w-6 text-teal-400 fill-teal-400/20" />
                    ) : (
                      <Circle className="h-6 w-6 text-zinc-600 group-hover:text-amber-400 transition-colors" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-sm font-black truncate ${
                          isPaid ? "line-through text-zinc-500" : "text-zinc-100"
                        }`}
                      >
                        {item.name}
                      </span>
                      {item.due_day && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-zinc-900 border border-black text-amber-300">
                          Tgl {item.due_day}
                        </span>
                      )}
                      {isPaid ? (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-400 border border-teal-500/30">
                          Lunas
                        </span>
                      ) : (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          Belum
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-xs font-extrabold mt-0.5 ${
                        isPaid ? "text-zinc-500 line-through" : "text-amber-400"
                      }`}
                    >
                      {mask(item.amount)}
                    </p>
                  </div>
                </div>

                {/* Right: Actions (Edit & Delete) */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    title="Ubah nominal / nama"
                    className="h-8 w-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-black shadow-[1px_1px_0px_0px_#000] flex items-center justify-center transition-all cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id, item.name)}
                    title="Hapus pos"
                    className="h-8 w-8 rounded-lg bg-zinc-900 hover:bg-rose-950 text-zinc-400 hover:text-rose-400 border border-black shadow-[1px_1px_0px_0px_#000] flex items-center justify-center transition-all cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-xs">
          <Card className="max-w-md w-full border-2 border-black bg-zinc-900 p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4 relative">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <ReceiptText className="h-5 w-5 text-amber-400" />
                <h3 className="text-base font-black text-zinc-100 uppercase tracking-wide">
                  {editingItem ? "Ubah Pengeluaran Wajib" : "Tambah Pengeluaran Wajib"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="h-7 w-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 flex items-center justify-center border border-black"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border-2 border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-zinc-400 mb-1">
                  Nama Pos Pengeluaran
                </label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: WiFi Indihome, Uang Kuliah, Listrik"
                  className="bg-zinc-950 border-2 border-black text-zinc-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-zinc-400 mb-1">
                  Nominal Tiap Bulan (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-extrabold text-zinc-500">
                    Rp
                  </span>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={formAmountStr}
                    onChange={(e) => {
                      const num = parseRupiahInput(e.target.value);
                      setFormAmountStr(formatRupiahInput(num));
                    }}
                    placeholder="350.000"
                    className="pl-9 bg-zinc-950 border-2 border-black text-zinc-100 font-extrabold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-zinc-400 mb-1">
                  Tanggal Jatuh Tempo (Opsional)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={formDueDay}
                  onChange={(e) => setFormDueDay(e.target.value)}
                  placeholder="Contoh: 10 (tanggal 10 setiap bulan)"
                  className="bg-zinc-950 border-2 border-black text-zinc-100"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Kosongkan jika tidak ada tanggal jatuh tempo tertentu.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="border-2 border-black"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending}
                  className="bg-amber-400 hover:bg-amber-300 text-black border-2 border-black shadow-[2px_2px_0px_0px_#000] font-black px-5"
                >
                  {isPending ? "Menyimpan..." : "Simpan Pos"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </Card>
  );
}
