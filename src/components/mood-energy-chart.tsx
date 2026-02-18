"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { MoodEntry } from "@/types/database";

interface MoodEnergyChartProps {
  entries: MoodEntry[];
}

interface ChartPoint {
  date: string;
  mood: number | null;
  energy: number | null;
}

function aggregateByDate(entries: MoodEntry[]): ChartPoint[] {
  const map = new Map<string, { moodSum: number; energySum: number; count: number }>();

  for (const e of entries) {
    const dateKey = new Date(e.logged_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const existing = map.get(dateKey) ?? { moodSum: 0, energySum: 0, count: 0 };
    existing.moodSum += e.mood_score;
    existing.energySum += e.energy_score;
    existing.count += 1;
    map.set(dateKey, existing);
  }

  return Array.from(map.entries()).map(([date, { moodSum, energySum, count }]) => ({
    date,
    mood: Math.round((moodSum / count) * 10) / 10,
    energy: Math.round((energySum / count) * 10) / 10,
  }));
}

export function MoodEnergyChart({ entries }: MoodEnergyChartProps) {
  if (entries.length === 0) {
    return (
      <section>
        <h2 className="mb-4 text-lg font-semibold tracking-tight">
          Mood &amp; Energy
        </h2>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-foreground/15 px-6 py-12 text-center">
          <p className="text-sm font-medium text-foreground/70">No mood data yet</p>
          <p className="mt-1 text-sm text-foreground/50">
            Mood and energy trends will chart here over time.
          </p>
        </div>
      </section>
    );
  }

  const data = aggregateByDate(entries);

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold tracking-tight">
        Mood &amp; Energy
      </h2>
      <div className="rounded-lg border border-foreground/10 p-4">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              stroke="currentColor"
              opacity={0.4}
            />
            <YAxis
              domain={[1, 10]}
              tick={{ fontSize: 12 }}
              stroke="currentColor"
              opacity={0.4}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--background)",
                border: "1px solid var(--foreground)",
                borderRadius: "8px",
                opacity: 0.9,
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="mood"
              stroke="var(--color-chart-mood, #6366f1)"
              strokeWidth={2}
              dot={{ r: 4 }}
              name="Mood"
            />
            <Line
              type="monotone"
              dataKey="energy"
              stroke="var(--color-chart-energy, #f59e0b)"
              strokeWidth={2}
              dot={{ r: 4 }}
              name="Energy"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
