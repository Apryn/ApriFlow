"use client";

import { useMemo } from "react";
import { formatRupiah } from "@/lib/utils/currency";
import type { TransactionWithCategory } from "@/types/database.types";
import { Card, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface CashFlowChartProps {
  transactions: TransactionWithCategory[];
}

export function CashFlowChart({ transactions }: CashFlowChartProps) {
  // Group current month's transactions into 5-day intervals
  const chartData = useMemo(() => {
    const intervals = [
      { label: "1-6", income: 0, expense: 0 },
      { label: "7-12", income: 0, expense: 0 },
      { label: "13-18", income: 0, expense: 0 },
      { label: "19-24", income: 0, expense: 0 },
      { label: "25+", income: 0, expense: 0 },
    ];

    for (const tx of transactions) {
      const dateVal = new Date(tx.date);
      const day = dateVal.getDate();

      let idx = 4; // default to 25+
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

  // Find max value for scaling SVG height
  const maxVal = useMemo(() => {
    let max = 50000; // minimum scale threshold
    for (const d of chartData) {
      if (d.income > max) max = d.income;
      if (d.expense > max) max = d.expense;
    }
    return max * 1.1; // add 10% padding
  }, [chartData]);

  // SVG dimensions
  const height = 160;
  const width = 280;
  const paddingX = 40;
  const paddingY = 20;

  const chartHeight = height - paddingY * 2;
  const chartWidth = width - paddingX - 10;

  // Calculate bars positions
  const numGroups = chartData.length;
  const groupWidth = chartWidth / numGroups;
  const barWidth = groupWidth * 0.35;
  const gap = groupWidth * 0.08;

  return (
    <Card className="border-2 border-black bg-zinc-900 p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-4">
      <div className="flex items-center justify-between border-b-2 border-black pb-2">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Grafik Arus Kas (Bulan Ini)
        </CardTitle>
        <div className="flex items-center gap-3 text-[10px] font-bold">
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-teal-400 border border-black" />
            <span className="text-zinc-300">Masuk</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-rose-500 border border-black" />
            <span className="text-zinc-300">Keluar</span>
          </div>
        </div>
      </div>

      <div className="flex justify-center items-center py-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-[320px] overflow-visible">
          {/* Grid lines */}
          {[0, 0.5, 1].map((ratio) => {
            const y = paddingY + chartHeight * (1 - ratio);
            const val = maxVal * ratio;
            return (
              <g key={ratio}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - 10}
                  y2={y}
                  stroke="#27272a"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  textAnchor="end"
                  fill="#71717a"
                  className="text-[8px] font-extrabold"
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

          {/* Draw bars */}
          {chartData.map((d, i) => {
            const groupX = paddingX + i * groupWidth;

            // Income bar
            const incomeHeight = (d.income / maxVal) * chartHeight;
            const incomeY = paddingY + chartHeight - incomeHeight;
            const incomeBarX = groupX + gap;

            // Expense bar
            const expenseHeight = (d.expense / maxVal) * chartHeight;
            const expenseY = paddingY + chartHeight - expenseHeight;
            const expenseBarX = incomeBarX + barWidth + gap * 0.5;

            return (
              <g key={d.label}>
                {/* Income Bar Shadow */}
                {d.income > 0 && (
                  <rect
                    x={incomeBarX + 1.5}
                    y={incomeY + 1.5}
                    width={barWidth}
                    height={incomeHeight}
                    fill="black"
                    rx="2"
                  />
                )}
                {/* Income Bar */}
                {d.income > 0 && (
                  <rect
                    x={incomeBarX}
                    y={incomeY}
                    width={barWidth}
                    height={incomeHeight}
                    fill="#2dd4bf"
                    stroke="black"
                    strokeWidth="2"
                    rx="2"
                  />
                )}

                {/* Expense Bar Shadow */}
                {d.expense > 0 && (
                  <rect
                    x={expenseBarX + 1.5}
                    y={expenseY + 1.5}
                    width={barWidth}
                    height={expenseHeight}
                    fill="black"
                    rx="2"
                  />
                )}
                {/* Expense Bar */}
                {d.expense > 0 && (
                  <rect
                    x={expenseBarX}
                    y={expenseY}
                    width={barWidth}
                    height={expenseHeight}
                    fill="#f43f5e"
                    stroke="black"
                    strokeWidth="2"
                    rx="2"
                  />
                )}

                {/* X Axis Labels */}
                <text
                  x={groupX + groupWidth / 2}
                  y={height - 2}
                  textAnchor="middle"
                  fill="#a1a1aa"
                  className="text-[9px] font-black"
                >
                  {d.label}
                </text>
              </g>
            );
          })}

          {/* Bottom baseline */}
          <line
            x1={paddingX}
            y1={paddingY + chartHeight}
            x2={width - 10}
            y2={paddingY + chartHeight}
            stroke="black"
            strokeWidth="2.5"
          />
        </svg>
      </div>
    </Card>
  );
}
