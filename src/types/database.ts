export interface Checkin {
  id: string;
  user_id: string;
  transcript: string;
  question_id: string | null;
  question_text: string | null;
  session_id: string | null;
  recorded_at: string;
  processed: boolean;
  created_at: string;
}

export interface MoodEntry {
  id: string;
  user_id: string;
  checkin_id: string;
  mood_score: number;
  energy_score: number;
  mood_tags: string[];
  notes: string | null;
  logged_at: string;
  created_at: string;
}

export interface Meal {
  id: string;
  user_id: string;
  checkin_id: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  description: string | null;
  foods: string[];
  logged_at: string;
  created_at: string;
}

export interface PresenceSession {
  id: string;
  user_id: string;
  arrived_at: string;
  departed_at: string | null;
  created_at: string;
}

export interface WorkEntry {
  id: string;
  user_id: string;
  checkin_id: string;
  project: string | null;
  task_description: string | null;
  status: "starting" | "in_progress" | "completed" | "blocked";
  logged_at: string;
  created_at: string;
}
