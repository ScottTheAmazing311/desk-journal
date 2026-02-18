import type { MoodEntry, PresenceSession } from "@/types/database";

interface SummaryCardsProps {
  checkinCount: number;
  mealsLogged: number;
  moodEntries: MoodEntry[];
  presenceSessions: PresenceSession[];
}

function computeAvgMood(entries: MoodEntry[]): string {
  if (entries.length === 0) return "—";
  const avg = entries.reduce((sum, e) => sum + e.mood_score, 0) / entries.length;
  return avg.toFixed(1);
}

function computeDeskHours(sessions: PresenceSession[]): string {
  if (sessions.length === 0) return "0h";
  const now = new Date();
  let totalMs = 0;
  for (const s of sessions) {
    const start = new Date(s.arrived_at);
    const end = s.departed_at ? new Date(s.departed_at) : now;
    totalMs += end.getTime() - start.getTime();
  }
  const hours = totalMs / (1000 * 60 * 60);
  return `${hours.toFixed(1)}h`;
}

const cards = [
  { key: "checkins", label: "Check-ins today" },
  { key: "meals", label: "Meals logged" },
  { key: "mood", label: "Avg mood (7d)" },
  { key: "desk", label: "Desk hours" },
] as const;

export function SummaryCards({
  checkinCount,
  mealsLogged,
  moodEntries,
  presenceSessions,
}: SummaryCardsProps) {
  const values: Record<string, string> = {
    checkins: String(checkinCount),
    meals: String(mealsLogged),
    mood: computeAvgMood(moodEntries),
    desk: computeDeskHours(presenceSessions),
  };

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.key}
          className="rounded-lg border border-foreground/10 bg-foreground/[0.02] px-4 py-5"
        >
          <p className="text-sm text-foreground/60">{c.label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">
            {values[c.key]}
          </p>
        </div>
      ))}
    </div>
  );
}
