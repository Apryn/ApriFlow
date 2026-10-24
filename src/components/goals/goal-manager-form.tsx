"use client";

import { useState, useTransition } from "react";
import { createGoalAction, updateGoalProgressAction, deleteGoalAction } from "@/actions/goal.actions";
import { formatRupiahInput, parseRupiahInput } from "@/lib/utils/currency";
import { useVisibility } from "@/components/providers/visibility-provider";
import type { Goal } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Card, CardHeader } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Trash2, Trophy, Save } from "lucide-react";

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
    <div className="grid gap-5 md:grid-cols-5">
      <Card className="space-y-4 md:col-span-2 self-start">
        <CardHeader title="Buat Target Baru" />

        {error && <Alert variant="error">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <form onSubmit={handleCreate} className="space-y-3.5">
          <div>
            <Label htmlFor="goal_name">Nama Target / Impian</Label>
            <Input
              id="goal_name"
              placeholder="Contoh: DP Motor, Dana Darurat"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
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

          <div>
            <Label htmlFor="goal_date">Tenggat Waktu (opsional)</Label>
            <Input
              id="goal_date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="goal_notes">Catatan Tambahan</Label>
            <Textarea
              id="goal_notes"
              placeholder="Detail rencana..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            className="w-full mt-2"
            disabled={isPending}
          >
            {isPending ? "Memproses..." : "Buat Target Keuangan"}
          </Button>
        </form>
      </Card>

      <div className="md:col-span-3 space-y-3">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-1">
          Daftar Target Keuangan
        </h3>

        {goals.length === 0 ? (
          <Card className="text-center text-zinc-500 text-xs py-8">
            Belum ada target tabungan yang ingin dicapai.
          </Card>
        ) : (
          <div className="space-y-3">
            {goals.map((g) => {
              const target = Number(g.target_amount);
              const current = Number(g.current_amount);
              const percent = Math.round(target > 0 ? (current / target) * 100 : 0);
              const userVal = editProgress[g.id] ?? formatRupiahInput(current);

              return (
                <Card key={g.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3 border-b border-zinc-800 pb-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-zinc-100 text-sm">{g.name}</p>
                        {g.is_completed && <Trophy className="h-4 w-4 text-yellow-400 shrink-0" />}
                      </div>
                      {g.target_date && (
                        <p className="text-[11px] text-zinc-500 font-medium mt-0.5">
                          Tenggat: {g.target_date}
                        </p>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-zinc-500 hover:text-rose-400"
                      onClick={() => handleDelete(g.id)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {g.notes && <p className="text-xs text-zinc-400 leading-relaxed italic bg-surface-2 px-2.5 py-1.5 rounded-lg border border-zinc-800">&quot;{g.notes}&quot;</p>}

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-zinc-400">
                      <span>Progres ({percent}%)</span>
                      <span className="tabular">
                        <span className="text-zinc-100">{mask(current)}</span> / {mask(target)}
                      </span>
                    </div>
                    <Progress value={percent} tone="accent" />
                  </div>

                  <div className="flex items-end gap-2 pt-2 border-t border-zinc-800">
                    <div className="flex-1 space-y-1">
                      <Label htmlFor={`progress-${g.id}`} className="text-[10px]">Update Terkumpul (Rp)</Label>
                      <Input
                        id={`progress-${g.id}`}
                        value={userVal}
                        className="h-8 text-xs"
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
                      variant="secondary"
                      className="h-8 text-xs shrink-0"
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
