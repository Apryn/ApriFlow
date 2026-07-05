"use client";

import { useState, useEffect, useTransition } from "react";
import { Plus, Undo2, AlertCircle, Sparkles, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createQuickTransactionAction, undoQuickTransactionAction } from "@/actions/transaction.actions";

export function QuickTransactionInput() {
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ id: string; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-hide toast after 5 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 5000);
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
    } catch (err) {
      setError("Terjadi kesalahan saat membatalkan transaksi.");
    }
  };

  return (
    <div className="relative w-full mb-5">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Catat cepat (e.g. kopi 25rb tunai, gajian 5jt tf)..."
            disabled={isPending}
            className="pr-10 rounded-2xl bg-zinc-950 border-2 border-black hover:border-zinc-800 focus:border-teal-400 focus:shadow-[2px_2px_0px_0px_#000] text-sm h-11 text-zinc-100 placeholder:text-zinc-600 focus:ring-0 focus:outline-none transition-all"
          />
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center select-none pointer-events-none text-teal-400">
            <Sparkles className="h-4 w-4 animate-pulse" />
          </div>
        </div>
        <Button
          type="submit"
          disabled={isPending || !text.trim()}
          className="bg-teal-400 hover:bg-teal-300 text-black border-2 border-black rounded-2xl shrink-0 h-11 px-4 flex items-center justify-center shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000] transition-all"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Plus className="h-4 w-4 md:mr-1.5" />
              <span className="hidden md:inline">Catat</span>
            </>
          )}
        </Button>
      </form>

      {/* Error message */}
      {error && (
        <div className="mt-2 text-xs text-red-400 bg-zinc-900 px-3.5 py-2.5 rounded-xl flex items-center gap-2 border-2 border-red-500/50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-in fade-in slide-in-from-top-1 duration-200">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span className="font-bold">{error}</span>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex w-[90%] max-w-md items-center justify-between gap-3 rounded-2xl border-2 border-black bg-zinc-900 text-zinc-100 px-4 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] backdrop-blur-md animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex flex-1 items-center gap-2.5 min-w-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-400/20 text-teal-400 border border-teal-400/30 shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <p className="text-xs font-bold truncate">
              {toast.message}
            </p>
          </div>
          <button
            onClick={handleUndo}
            className="flex items-center gap-1 rounded-xl bg-zinc-800 text-zinc-100 border border-black hover:bg-zinc-700 shadow-[1px_1px_0px_0px_#000] px-2.5 py-1.5 text-xs font-bold active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all"
          >
            <Undo2 className="h-3.5 w-3.5" />
            Batal
          </button>
        </div>
      )}
    </div>
  );
}
