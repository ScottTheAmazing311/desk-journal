import type { Checkin } from "@/types/database";
import { EmptyState } from "@/components/empty-state";

interface RecentCheckinsProps {
  checkins: Checkin[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function groupByDate(checkins: Checkin[]): Map<string, Checkin[]> {
  const groups = new Map<string, Checkin[]>();
  for (const c of checkins) {
    const dateKey = new Date(c.recorded_at).toDateString();
    const existing = groups.get(dateKey) ?? [];
    existing.push(c);
    groups.set(dateKey, existing);
  }
  return groups;
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "…";
}

export function RecentCheckins({ checkins }: RecentCheckinsProps) {
  const grouped = groupByDate(checkins);

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold tracking-tight">
        Recent Check-ins
      </h2>
      {checkins.length === 0 ? (
        <EmptyState
          title="No recent check-ins"
          description="Check-ins from the last 7 days will show up here."
        />
      ) : (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([dateKey, items]) => (
            <div key={dateKey}>
              <h3 className="mb-2 text-sm font-medium text-foreground/50">
                {formatDate(items[0].recorded_at)}
              </h3>
              <div className="space-y-3">
                {items.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-lg border border-foreground/10 px-4 py-3"
                  >
                    <p className="text-xs text-foreground/50">
                      {formatTime(c.recorded_at)}
                      {c.question_text && (
                        <span className="ml-2 text-foreground/40">
                          — {c.question_text}
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-foreground/80">
                      {truncate(c.transcript, 300)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
