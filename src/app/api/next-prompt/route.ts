import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type TimeSlot = "morning" | "afternoon" | "end_of_day";

function getTimeSlot(hour: number): TimeSlot {
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "end_of_day";
}

function getDayOfWeek(date: Date): number {
  return date.getDay(); // 0 = Sunday, 1 = Monday, ...
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const context = searchParams.get("context"); // "first_arrival", "return_from_break", "post_meeting"
    const meetingName = searchParams.get("meeting_name");

    if (!userId) {
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
    }

    const now = new Date();
    const hour = now.getHours();
    const timeSlot = getTimeSlot(hour);
    const isMonday = getDayOfWeek(now) === 1;
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    // Get today's check-ins to see what we've already asked
    const { data: todayCheckins } = await supabase
      .from("checkins")
      .select("question_id, question_text, recorded_at")
      .eq("user_id", userId)
      .gte("recorded_at", todayStart.toISOString())
      .order("recorded_at", { ascending: false });

    const askedQuestionIds = new Set(
      (todayCheckins || []).map((c) => c.question_id).filter(Boolean)
    );

    // Check what data is missing today
    const [{ data: todayMeals }, { data: todayMood }, { data: todayWork }] = await Promise.all([
      supabase
        .from("meals")
        .select("meal_type")
        .eq("user_id", userId)
        .gte("logged_at", todayStart.toISOString()),
      supabase
        .from("mood_entries")
        .select("id, logged_at")
        .eq("user_id", userId)
        .gte("logged_at", todayStart.toISOString())
        .order("logged_at", { ascending: false })
        .limit(1),
      supabase
        .from("work_entries")
        .select("id")
        .eq("user_id", userId)
        .gte("logged_at", todayStart.toISOString())
        .limit(1),
    ]);

    const loggedMealTypes = new Set((todayMeals || []).map((m) => m.meal_type));
    const lastMoodTime = todayMood?.[0]?.logged_at
      ? new Date(todayMood[0].logged_at)
      : null;
    const moodStale = !lastMoodTime || (now.getTime() - lastMoodTime.getTime()) > 4 * 60 * 60 * 1000;
    const noWorkLogged = !todayWork?.length;

    // Determine priority category
    let category: string;

    if (context === "post_meeting" && meetingName) {
      // Post-meeting takes highest priority
      return NextResponse.json({
        question_text: `How did ${meetingName} go?`,
        category: "post_meeting",
        source: "dynamic",
      });
    }

    if (context === "return_from_break" && hour >= 11 && hour <= 14 && !loggedMealTypes.has("lunch")) {
      category = "return";
    } else if (context === "first_arrival" && isMonday) {
      category = "weekly";
    } else if (context === "first_arrival" && hour < 11) {
      category = "morning";
    } else if (moodStale) {
      category = "afternoon";
    } else if (hour >= 16) {
      category = "end_of_day";
    } else if (!loggedMealTypes.has("breakfast") && hour < 11) {
      category = "morning";
    } else if (!loggedMealTypes.has("lunch") && hour >= 11 && hour <= 14) {
      category = "return";
    } else if (noWorkLogged) {
      category = "open";
    } else {
      // Check for AI-generated follow-ups first
      category = "follow_up";
    }

    // Fetch a question from the selected category that hasn't been asked today
    let { data: questions } = await supabase
      .from("questions")
      .select("id, text, category")
      .eq("user_id", userId)
      .eq("category", category)
      .eq("active", true)
      .order("created_at", { ascending: false });

    // Filter out already-asked questions
    questions = (questions || []).filter((q) => !askedQuestionIds.has(q.id));

    // If no questions in the preferred category, fall back to "open"
    if (!questions.length && category !== "open") {
      const { data: fallback } = await supabase
        .from("questions")
        .select("id, text, category")
        .eq("user_id", userId)
        .eq("category", "open")
        .eq("active", true);

      questions = (fallback || []).filter((q) => !askedQuestionIds.has(q.id));
    }

    if (!questions.length) {
      return NextResponse.json({
        question_text: "What's on your mind right now?",
        category: "open",
        source: "fallback",
      });
    }

    // Pick a random question from the available ones
    const picked = questions[Math.floor(Math.random() * questions.length)];

    return NextResponse.json({
      question_id: picked.id,
      question_text: picked.text,
      category: picked.category,
      source: "database",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to get next prompt" },
      { status: 500 }
    );
  }
}
