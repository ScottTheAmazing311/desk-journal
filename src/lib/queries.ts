import { createClient } from "@/lib/supabase/server";
import type { Checkin, MoodEntry, Meal, PresenceSession } from "@/types/database";

function startOfToday(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function sevenDaysAgo(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function getTodayCheckins(): Promise<Checkin[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("checkins")
    .select("*")
    .gte("recorded_at", startOfToday())
    .order("recorded_at", { ascending: true });

  if (error) {
    console.error("getTodayCheckins error:", error.message);
    return [];
  }
  return data ?? [];
}

export async function getRecentCheckins(): Promise<Checkin[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("checkins")
    .select("*")
    .gte("recorded_at", sevenDaysAgo())
    .order("recorded_at", { ascending: false });

  if (error) {
    console.error("getRecentCheckins error:", error.message);
    return [];
  }
  return data ?? [];
}

export async function getRecentMoodEntries(): Promise<MoodEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mood_entries")
    .select("*")
    .gte("logged_at", sevenDaysAgo())
    .order("logged_at", { ascending: true });

  if (error) {
    console.error("getRecentMoodEntries error:", error.message);
    return [];
  }
  return data ?? [];
}

export async function getTodayMeals(): Promise<Meal[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meals")
    .select("*")
    .gte("logged_at", startOfToday())
    .order("logged_at", { ascending: true });

  if (error) {
    console.error("getTodayMeals error:", error.message);
    return [];
  }
  return data ?? [];
}

export async function getTodayPresence(): Promise<PresenceSession[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("presence_sessions")
    .select("*")
    .gte("arrived_at", startOfToday())
    .order("arrived_at", { ascending: true });

  if (error) {
    console.error("getTodayPresence error:", error.message);
    return [];
  }
  return data ?? [];
}
