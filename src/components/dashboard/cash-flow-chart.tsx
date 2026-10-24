"use client";

import { useMemo } from "react";
import type { TransactionWithCategory } from "@/types/database.types";
import { Card, CardHeader } from "@/components/ui/card";

interface CashFlowChartProps {
  transactions: TransactionWithCategory[];
}

export function CashFlowChart({ transactions }: CashFlowChartProps) {
  const chartData = useMemo(() => {
    const intervals = [
      { label: "1-6", income: 0, expense: 0 },
      { label: "7-12", income: 0, expense: 0 },
      { label: "13-18", income: 0, expense: 0 },
      { label: "19-24", income: 0, expense: 0 },
      { label: "25+", income: 0, expense: 0 },
    ];

    for (const tx of transactions) {
      const day = new Date(tx.date).getDate();
      let idx = 4;
      if (day <= 6) idx = 0;
      else if (day <= 12) idx = 1;
      else if (day <= 18) idx = 2;
      else if (day <= 24) idx = 3;

      const amount = Number(tx.amount);
      if (tx.type === "income") {
        intervals[idx].income += amount;
      } else {
        intervals[idx].expense += amount;
      }
    }
    return intervals;
  }, [transactions]);

  const maxVal = useMemo(() => {
    let max = 50000;
    for (const d of chartData) {
      if (d.income > max) max = d.income;
      if (d.expense > max) max = d.expense;
    }
    return max * 1.1;
  }, [chartData]);

  const height = 150;
  const width = 280;
  const paddingX = 36;
  const paddingY = 16;
  const chartHeight = height - paddingY * 2;
  const chartWidth = width - paddingX - 8;

  const numGroups = chartData.length;
  const groupWidth = chartWidth / numGroups;
  const barWidth = groupWidth * 0.35;
  const gap = groupWidth * 0.08;

  return (
    <Card className="space-y-2">
      <CardHeader
        title="Arus Kas Bulan Ini"
        action={
          <div className="flex items-center gap-2.5 text-[11px] font-semibold">
            <span className="flex items-center gap-1 text-teal-400">
              <span className="h-2 w-2 rounded-full bg-teal-400" />
              Masuk
            </span>
            <span className="flex items-center gap-1 text-rose-400">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              Keluar
            </span>
          </div>
        }
      />

      <div className="flex items-center justify-center py-1">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-[320px] overflow-visible">
          {[0, 0.5, 1].map((ratio) => {
            const y = paddingY + chartHeight * (1 - ratio);
            const val = maxVal * ratio;
            return (
              <g key={ratio}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - 8}
                  y2={y}
                  stroke="#27272a"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <text
                  x={paddingX - 6}
                  y={y + 3}
                  textAnchor="end"
                  fill="#71717a"
                  className="text-[8px] font-semibold"
                >
                  {val >= 1000000
                    ? `${(val / 1000000).toFixed(1)}M`
                    : val >= 1000
                    ? `${(val / 1000).toFixed(0)}k`
                    : val.toFixed(0)}
                </text>
              </g>
            );
          })}

          {chartData.map((d, i) => {
            const groupX = paddingX + i * groupWidth;
            const incomeHeight = (d.income / maxVal) * chartHeight;
            const incomeY = paddingY + chartHeight - incomeHeight;
            const incomeBarX = groupX + gap;

            const expenseHeight = (d.expense / maxVal) * chartHeight;
            const expenseY = paddingY + chartHeight - expenseHeight;
            const expenseBarX = incomeBarX + barWidth + gap * 0.5;

            return (
              <g key={d.label}>
                {d.income > 0 && (
                  <rect
                    x={incomeBarX}
                    y={incomeY}
                    width={barWidth}
                    height={incomeHeight}
                    fill="#2dd4bf"
                    stroke="#000"
                    strokeWidth="1.5"
                    rx="2"
                  />
                )}
                {d.expense > 0 && (
                  <rect
                    x={expenseBarX}
                    y={expenseY}
                    width={barWidth}
                    height={expenseHeight}
                    fill="#f43f5e"
                    stroke="#000"
                    strokeWidth="1.5"
                    rx="2"
                  />
                )}
                <text
                  x={groupX + groupWidth / 2}
                  y={height - 2}
                  textAnchor="middle"
                  fill="#71717a"
                  className="text-[9px] font-semibold"
                >
                  {d.label}
                </text>
              </g>
            );
          })}

          <line
            x1={paddingX}
            y1={paddingY + chartHeight}
            x2={width - 8}
            y2={paddingY + chartHeight}
            stroke="#000"
            strokeWidth="2"
          />
        </svg>
      </div>
    </Card>
  );
}
