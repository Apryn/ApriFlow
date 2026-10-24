"use client";

import Link from "next/link";
import { useVisibility } from "@/components/providers/visibility-provider";
import type { Goal } from "@/types/database.types";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { PlusCircle, Target } from "lucide-react";

interface GoalWidgetProps {
  goals: Goal[];
}

export function GoalWidget({ goals }: GoalWidgetProps) {
  const { mask } = useVisibility();

  if (goals.length === 0) {
    return (
      <Card>
        <CardHeader title="Target Keuangan (Goals)" href="/goals" linkLabel="Kelola" />
        <EmptyState
          compact
          icon={Target}
          title="Belum ada target tabungan"
          description="Buat target impian seperti DP rumah, dana darurat, atau liburan."
          action={
            <Link href="/goals">
              <Button size="sm">
                <PlusCircle className="h-3.5 w-3.5" />
                Buat Target
              </Button>
            </Link>
          }
        />
      </Card>
    );
  }

  return (
    <Card className="space-y-3.5">
      <CardHeader title="Target Keuangan (Goals)" href="/goals" linkLabel="Kelola" />

      <div className="space-y-3">
        {goals.map((goal) => {
          const target = Number(goal.target_amount);
          const current = Number(goal.current_amount);
          const percent = Math.round(target > 0 ? (current / target) * 100 : 0);

          return (
            <div key={goal.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-zinc-200 truncate">{goal.name}</span>
                <span className="tabular text-zinc-400">
                  <span className="text-zinc-200">{mask(current)}</span> / {mask(target)}
                </span>
              </div>
              <Progress value={percent} tone={goal.is_completed ? "accent" : "accent"} />
              <div className="flex items-center justify-between text-[11px] text-zinc-500">
                <span>{percent}% tercapai</span>
                {goal.target_date && <span>Target: {goal.target_date}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
