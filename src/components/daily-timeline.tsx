import type { Checkin } from "@/types/database";
import { EmptyState } from "@/components/empty-state";

interface DailyTimelineProps {
  checkins: Checkin[];
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "…";
}

export function DailyTimeline({ checkins }: DailyTimelineProps) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold tracking-tight">
        Today&apos;s Timeline
      </h2>
      {checkins.length === 0 ? (
        <EmptyState
          title="No check-ins yet"
          description="Your timeline will appear here once you start checking in."
        />
      ) : (
        <div className="relative space-y-6 pl-6 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-foreground/15">
          {checkins.map((c) => (
            <div key={c.id} className="relative">
              <span className="absolute -left-6 top-1.5 h-3 w-3 rounded-full border-2 border-foreground/30 bg-background" />
              <p className="text-xs font-medium text-foreground/50">
                {formatTime(c.recorded_at)}
                {c.question_text && (
                  <span className="ml-2 text-foreground/40">
                    — {c.question_text}
                  </span>
                )}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-foreground/80">
                {truncate(c.transcript, 200)}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
