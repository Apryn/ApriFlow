"use client";

import { useState, useTransition } from "react";
import { createGoalAction, updateGoalProgressAction, deleteGoalAction } from "@/actions/goal.actions";
import { formatRupiah, formatRupiahInput, parseRupiahInput } from "@/lib/utils/currency";
import { useVisibility } from "@/components/providers/visibility-provider";
import type { Goal } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Trash2, AlertCircle, Trophy, Save, Sparkles, CheckCircle2 } from "lucide-react";

interface GoalManagerFormProps {
  initialGoals: Goal[];
}

export function GoalManagerForm({ initialGoals }: GoalManagerFormProps) {
  const { mask } = useVisibility();
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [name, setName] = useState("");
  const [targetAmountDisplay, setTargetAmountDisplay] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Keep track of edits to current_amount per goal
  const [editProgress, setEditProgress] = useState<Record<string, string>>({});

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetAmount = parseRupiahInput(targetAmountDisplay);
    if (!name.trim()) {
      setError("Nama target tidak boleh kosong.");
      return;
    }
    if (targetAmount <= 0) {
      setError("Target nominal harus lebih besar dari Rp 0.");
      return;
    }

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const res = await createGoalAction(name, targetAmount, targetDate, notes);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess("Target keuangan baru berhasil dibuat!");
        setName("");
        setTargetAmountDisplay("");
        setTargetDate("");
        setNotes("");

        // Optimistically add to local state
        const tempId = `temp-${Date.now()}`;
        setGoals((prev) => [
          ...prev,
          {
            id: tempId,
            user_id: "",
            name: name.trim(),
            target_amount: targetAmount,
            current_amount: 0,
            target_date: targetDate || null,
            notes: notes || null,
            is_completed: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);
      }
    });
  };

  const handleSaveProgress = async (goalId: string) => {
    const displayVal = editProgress[goalId];
    if (displayVal === undefined) return;

    const amount = parseRupiahInput(displayVal);
    if (amount < 0) {
      setError("Nominal tabungan tidak boleh negatif.");
      return;
    }

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const res = await updateGoalProgressAction(goalId, amount);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess("Progres target berhasil diperbarui!");
        setGoals((prev) =>
          prev.map((g) => {
            if (g.id === goalId) {
              const target = Number(g.target_amount);
              return {
                ...g,
                current_amount: amount,
                is_completed: amount >= target,
              };
            }
            return g;
          })
        );
      }
    });
  };

  const handleDelete = async (goalId: string) => {
    if (!confirm("Hapus target keuangan ini?")) return;

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      let res;
      if (goalId.startsWith("temp-")) {
        res = { success: true, error: undefined };
      } else {
        res = await deleteGoalAction(goalId);
      }

      if (res.error) {
        setError(res.error);
      } else {
        setSuccess("Target berhasil dihapus.");
        setGoals((prev) => prev.filter((g) => g.id !== goalId));
      }
    });
  };

  return (
    <div className="grid gap-6 md:grid-cols-5">
      {/* Create Goal Form */}
      <Card className="border-2 border-black bg-zinc-900 p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] md:col-span-2 space-y-4 self-start">
        <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider border-b-2 border-black pb-2 flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-teal-400" />
          Buat Target Baru
        </h3>

        {error && (
          <div className="flex items-center gap-1.5 p-3 rounded-lg bg-zinc-950 border-2 border-red-500/30 text-red-400 text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-1.5 p-3 rounded-lg bg-zinc-950 border-2 border-teal-500/30 text-teal-400 text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce-short">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="goal_name">Nama Target / Impian</Label>
            <Input
              id="goal_name"
              placeholder="Contoh: DP Motor, Dana Darurat"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="goal_target">Target Nominal (Rp)</Label>
            <Input
              id="goal_target"
              inputMode="numeric"
              placeholder="Rp 0"
              value={targetAmountDisplay}
              onChange={(e) => setTargetAmountDisplay(formatRupiahInput(parseRupiahInput(e.target.value)))}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="goal_date">Tenggat Waktu (opsional)</Label>
            <Input
              id="goal_date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="goal_notes">Catatan Tambahan</Label>
            <Textarea
              id="goal_notes"
              placeholder="Detail rencana..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[60px]"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-teal-400 hover:bg-teal-300 text-black border-2 border-black shadow-[2px_2px_0px_0px_#000] font-black h-11 rounded-xl"
            disabled={isPending}
          >
            {isPending ? "Memproses..." : "Buat Target Keuangan"}
          </Button>
        </form>
      </Card>

      {/* Goal list card grid */}
      <div className="md:col-span-3 space-y-3">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-1">
          Daftar Target Keuangan
        </h3>

        {goals.length === 0 ? (
          <Card className="border-2 border-black bg-zinc-900 p-6 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-center text-zinc-500 text-xs font-bold">
            Belum ada target tabungan yang ingin dicapai.
          </Card>
        ) : (
          <div className="space-y-4">
            {goals.map((g) => {
              const target = Number(g.target_amount);
              const current = Number(g.current_amount);
              const percent = Math.round(target > 0 ? (current / target) * 100 : 0);
              const progressPercent = Math.min(percent, 100);

              const userVal = editProgress[g.id] ?? formatRupiahInput(current);

              return (
                <Card
                  key={g.id}
                  className="p-4 border-2 border-black bg-zinc-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-3"
                >
                  <div className="flex items-start justify-between gap-3 border-b-2 border-black pb-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-zinc-100 text-sm">{g.name}</p>
                        {g.is_completed && <Trophy className="h-4 w-4 text-yellow-400 shrink-0" />}
                      </div>
                      {g.target_date && (
                        <p className="text-[10px] text-zinc-500 font-bold mt-0.5 uppercase tracking-wider">
                          Tenggat: {g.target_date}
                        </p>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 border border-transparent hover:border-red-500/30 text-zinc-500 hover:text-red-400 hover:bg-rose-950/20"
                      onClick={() => handleDelete(g.id)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {g.notes && <p className="text-xs text-zinc-400 leading-relaxed italic bg-zinc-950 px-2 py-1.5 rounded-lg border-2 border-black">&quot;{g.notes}&quot;</p>}

                  {/* Progress Info */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-zinc-400">
                      <span>Progres ({percent}%)</span>
                      <span>
                        <span className="text-purple-400">{mask(current)}</span> / {mask(target)}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-zinc-950 border-2 border-black rounded-full h-3.5 overflow-hidden relative shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                      <div
                        className="h-full bg-purple-500 border-r-2 border-black rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Update current progress form inline */}
                  <div className="flex items-end gap-2 pt-2 border-t border-zinc-800">
                    <div className="flex-1 space-y-1">
                      <Label htmlFor={`progress-${g.id}`} className="text-[10px] text-zinc-400">Update Terkumpul (Rp)</Label>
                      <Input
                        id={`progress-${g.id}`}
                        value={userVal}
                        className="py-1 px-2.5 h-8 text-xs text-zinc-100 bg-zinc-950"
                        onChange={(e) =>
                          setEditProgress((prev) => ({
                            ...prev,
                            [g.id]: formatRupiahInput(parseRupiahInput(e.target.value)),
                          }))
                        }
                      />
                    </div>
                    <Button
                      size="sm"
                      className="bg-zinc-800 text-zinc-100 border-2 border-black hover:bg-zinc-700 shadow-[1.5px_1.5px_0px_0px_#000] h-8 text-xs font-bold shrink-0 flex items-center gap-1"
                      onClick={() => handleSaveProgress(g.id)}
                      disabled={isPending || userVal === formatRupiahInput(current)}
                    >
                      <Save className="h-3.5 w-3.5" />
                      Simpan
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
