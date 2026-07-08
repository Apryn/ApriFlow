"use client";

import Link from "next/link";
import { formatRupiah } from "@/lib/utils/currency";
import { useVisibility } from "@/components/providers/visibility-provider";
import type { Goal } from "@/types/database.types";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trophy, Calendar } from "lucide-react";

interface GoalWidgetProps {
  goals: Goal[];
}

export function GoalWidget({ goals }: GoalWidgetProps) {
  const { mask } = useVisibility();

  if (goals.length === 0) {
    return (
      <Card className="border-2 border-black bg-zinc-900 p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-4">
        <div className="flex items-center justify-between border-b-2 border-black pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Target Keuangan (Goals)
          </CardTitle>
        </div>
        <div className="text-center py-4 space-y-3">
          <p className="text-xs text-zinc-500">Belum ada target keuangan yang ingin dicapai.</p>
          <Link href="/goals" className="inline-block">
            <Button size="sm" className="bg-teal-400 text-black border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:bg-teal-300">
              <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
              Buat Target
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-black bg-zinc-900 p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-4">
      <div className="flex items-center justify-between border-b-2 border-black pb-2">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Target Keuangan (Goals)
        </CardTitle>
        <Link href="/goals" className="text-xs font-bold text-teal-400 hover:underline">
          Kelola
        </Link>
      </div>

      <div className="space-y-5">
        {goals.map((goal) => {
          const target = Number(goal.target_amount);
          const current = Number(goal.current_amount);
          const percent = Math.round(target > 0 ? (current / target) * 100 : 0);
          const progressPercent = Math.min(percent, 100);

          return (
            <div key={goal.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-zinc-100 flex items-center gap-1.5">
                  {goal.name}
                  {goal.is_completed && (
                    <Trophy className="h-3.5 w-3.5 text-yellow-400" />
                  )}
                </span>
                <span className="text-zinc-400">
                  <span className="text-purple-400">{mask(current)}</span> / {mask(target)}
                </span>
              </div>

              {/* Neo-brutalist Progress Bar */}
              <div className="w-full bg-zinc-950 border-2 border-black rounded-full h-4 overflow-hidden relative shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                <div
                  className="h-full bg-purple-500 border-r-2 border-black rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Detail notes & target date */}
              <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold">
                <span>{percent}% tercapai</span>
                {goal.target_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Target: {goal.target_date}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
