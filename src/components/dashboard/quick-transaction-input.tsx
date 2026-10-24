"use client";

import { useState, useEffect, useTransition } from "react";
import { Plus, Undo2, Loader2, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { createQuickTransactionAction, undoQuickTransactionAction } from "@/actions/transaction.actions";

export function QuickTransactionInput() {
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ id: string; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isPending) return;

    setError(null);
    const inputText = text.trim();
    setText("");

    startTransition(async () => {
      const res = await createQuickTransactionAction(inputText);
      if (res.error) {
        setError(res.error);
        setText(inputText);
      } else if (res.success && res.transactionId && res.transactionSummary) {
        setToast({
          id: res.transactionId,
          message: res.transactionSummary,
        });
      }
    });
  };

  const handleUndo = async () => {
    if (!toast) return;
    const transactionId = toast.id;
    setToast(null);

    try {
      const res = await undoQuickTransactionAction(transactionId);
      if (res.error) {
        setError("Gagal membatalkan transaksi: " + res.error);
      }
    } catch {
      setError("Terjadi kesalahan saat membatalkan transaksi.");
    }
  };

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Catat cepat (e.g. kopi 25rb tunai, gajian 5jt tf)..."
            disabled={isPending}
            className="pr-9"
          />
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 select-none text-zinc-500">
            <Sparkles className="h-4 w-4" />
          </div>
        </div>
        <Button
          type="submit"
          disabled={isPending || !text.trim()}
          className="shrink-0"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Plus className="h-4 w-4" />
              <span>Catat</span>
            </>
          )}
        </Button>
      </form>

      {error && (
        <Alert variant="error" className="mt-2">
          {error}
        </Alert>
      )}

      {toast && (
        <div className="fixed bottom-20 left-1/2 z-50 flex w-[90%] max-w-md -translate-x-1/2 items-center justify-between gap-3 rounded-2xl border-2 border-black bg-zinc-900 px-4 py-3 text-zinc-100 shadow-nb-lg animate-slide-up backdrop-blur-md">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-400/20 text-teal-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <p className="truncate text-xs font-semibold">{toast.message}</p>
          </div>
          <button
            type="button"
            onClick={handleUndo}
            className="flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-black bg-zinc-800 px-2.5 py-1 text-xs font-bold text-zinc-200 shadow-nb-sm transition-all hover:bg-zinc-700 active:translate-x-px active:translate-y-px active:shadow-none"
          >
            <Undo2 className="h-3.5 w-3.5" />
            Batal
          </button>
        </div>
      )}
    </div>
  );
}
