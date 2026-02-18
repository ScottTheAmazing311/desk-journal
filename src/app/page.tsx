import {
  getTodayCheckins,
  getRecentCheckins,
  getRecentMoodEntries,
  getTodayMeals,
  getTodayPresence,
} from "@/lib/queries";
import { SummaryCards } from "@/components/summary-cards";
import { DailyTimeline } from "@/components/daily-timeline";
import { RecentCheckins } from "@/components/recent-checkins";
import { MoodEnergyChart } from "@/components/mood-energy-chart";

export default async function DashboardPage() {
  const [todayCheckins, recentCheckins, moodEntries, todayMeals, todayPresence] =
    await Promise.all([
      getTodayCheckins(),
      getRecentCheckins(),
      getRecentMoodEntries(),
      getTodayMeals(),
      getTodayPresence(),
    ]);

  return (
    <div className="min-h-screen bg-background font-sans">
      <header className="border-b border-foreground/10 px-6 py-4">
        <h1 className="text-xl font-semibold tracking-tight">Desk Journal</h1>
        <p className="text-sm text-foreground/60">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
        <SummaryCards
          checkinCount={todayCheckins.length}
          mealsLogged={todayMeals.length}
          moodEntries={moodEntries}
          presenceSessions={todayPresence}
        />

        <div className="grid gap-8 lg:grid-cols-2">
          <DailyTimeline checkins={todayCheckins} />
          <MoodEnergyChart entries={moodEntries} />
        </div>

        <RecentCheckins checkins={recentCheckins} />
      </main>
    </div>
  );
}
