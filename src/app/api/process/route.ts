import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const EXTRACTION_PROMPT = `You are a life journal assistant. Extract structured data from the user's voice check-in transcript. The question asked was: "{question}"

Return JSON with any applicable fields:
{
  "meals": [{ "meal_type": "breakfast|lunch|dinner|snack", "description": "", "foods": [] }],
  "mood": { "score": 1-10, "energy": 1-10, "tags": [] },
  "work": [{ "project": "", "task": "", "status": "starting|in_progress|completed|blocked" }],
  "worries": [{ "description": "", "category": "work|health|financial|relationship|general", "intensity": 1-5 }],
  "anticipations": [{ "description": "", "category": "event|goal|social|personal", "target_date": "" }],
  "people": [{ "name": "", "context": "", "sentiment": "positive|neutral|negative" }],
  "follow_up_questions": ["suggested questions to ask later"]
}

Only include fields that are clearly present in the transcript. Do not infer or fabricate data. Return valid JSON only, no markdown.`;

export async function POST(request: NextRequest) {
  try {
    const { checkin_id } = await request.json();

    if (!checkin_id) {
      return NextResponse.json({ error: "Missing checkin_id" }, { status: 400 });
    }

    // Fetch the check-in
    const { data: checkin, error: fetchError } = await supabase
      .from("checkins")
      .select("*")
      .eq("id", checkin_id)
      .single();

    if (fetchError || !checkin) {
      return NextResponse.json({ error: "Check-in not found" }, { status: 404 });
    }

    if (checkin.processed) {
      return NextResponse.json({ status: "already_processed" });
    }

    // Call Claude API
    const prompt = EXTRACTION_PROMPT.replace("{question}", checkin.question_text || "Open check-in");

    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 1024,
        messages: [
          { role: "user", content: `${prompt}\n\nTranscript: "${checkin.transcript}"` },
        ],
      }),
    });

    if (!claudeResponse.ok) {
      const errText = await claudeResponse.text();
      return NextResponse.json({ error: `Claude API error: ${errText}` }, { status: 502 });
    }

    const claudeData = await claudeResponse.json();
    const rawText = claudeData.content?.[0]?.text || "{}";

    let extracted;
    try {
      extracted = JSON.parse(rawText);
    } catch {
      return NextResponse.json({ error: "Failed to parse Claude response", raw: rawText }, { status: 500 });
    }

    const now = new Date().toISOString();

    // Insert extracted data into module tables
    const inserts = [];

    if (extracted.meals?.length) {
      inserts.push(
        supabase.from("meals").insert(
          extracted.meals.map((m: { meal_type: string; description: string; foods: string[] }) => ({
            user_id: checkin.user_id,
            checkin_id: checkin.id,
            meal_type: m.meal_type,
            description: m.description,
            foods: m.foods || [],
            logged_at: checkin.recorded_at,
          }))
        )
      );
    }

    if (extracted.mood) {
      inserts.push(
        supabase.from("mood_entries").insert({
          user_id: checkin.user_id,
          checkin_id: checkin.id,
          mood_score: extracted.mood.score,
          energy_score: extracted.mood.energy,
          mood_tags: extracted.mood.tags || [],
          logged_at: checkin.recorded_at,
        })
      );
    }

    if (extracted.work?.length) {
      inserts.push(
        supabase.from("work_entries").insert(
          extracted.work.map((w: { project: string; task: string; status: string }) => ({
            user_id: checkin.user_id,
            checkin_id: checkin.id,
            project: w.project,
            task_description: w.task,
            status: w.status,
            logged_at: checkin.recorded_at,
          }))
        )
      );
    }

    if (extracted.worries?.length) {
      inserts.push(
        supabase.from("worries").insert(
          extracted.worries.map((w: { description: string; category: string; intensity: number }) => ({
            user_id: checkin.user_id,
            checkin_id: checkin.id,
            description: w.description,
            category: w.category,
            intensity: w.intensity,
            logged_at: checkin.recorded_at,
          }))
        )
      );
    }

    if (extracted.anticipations?.length) {
      inserts.push(
        supabase.from("anticipations").insert(
          extracted.anticipations.map((a: { description: string; category: string; target_date: string }) => ({
            user_id: checkin.user_id,
            checkin_id: checkin.id,
            description: a.description,
            category: a.category,
            target_date: a.target_date || null,
            logged_at: checkin.recorded_at,
          }))
        )
      );
    }

    if (extracted.people?.length) {
      inserts.push(
        supabase.from("people_mentions").insert(
          extracted.people.map((p: { name: string; context: string; sentiment: string }) => ({
            user_id: checkin.user_id,
            checkin_id: checkin.id,
            person_name: p.name,
            context: p.context,
            sentiment: p.sentiment,
            logged_at: checkin.recorded_at,
          }))
        )
      );
    }

    // Store follow-up questions
    if (extracted.follow_up_questions?.length) {
      inserts.push(
        supabase.from("questions").insert(
          extracted.follow_up_questions.map((q: string) => ({
            user_id: checkin.user_id,
            category: "follow_up",
            text: q,
            is_generated: true,
            source_checkin_id: checkin.id,
          }))
        )
      );
    }

    // Run all inserts
    const results = await Promise.allSettled(inserts);
    const errors = results
      .filter((r): r is PromiseRejectedResult => r.status === "rejected")
      .map((r) => r.reason);

    // Mark check-in as processed
    await supabase
      .from("checkins")
      .update({ processed: true })
      .eq("id", checkin_id);

    return NextResponse.json({
      status: "processed",
      checkin_id,
      extracted,
      insert_errors: errors.length ? errors : undefined,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Processing failed" },
      { status: 500 }
    );
  }
}
