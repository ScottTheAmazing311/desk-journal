import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcript, question_id, question_text, recorded_at, session_id, user_id } = body;

    if (!transcript || !recorded_at || !user_id) {
      return NextResponse.json(
        { error: "Missing required fields: transcript, recorded_at, user_id" },
        { status: 400 }
      );
    }

    // Insert the check-in
    const { data: checkin, error: checkinError } = await supabase
      .from("checkins")
      .insert({
        user_id,
        transcript,
        question_id: question_id || null,
        question_text: question_text || null,
        session_id: session_id || null,
        recorded_at,
        processed: false,
      })
      .select()
      .single();

    if (checkinError) {
      return NextResponse.json({ error: checkinError.message }, { status: 500 });
    }

    // Trigger processing asynchronously
    const processUrl = new URL("/api/process", request.url);
    fetch(processUrl.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkin_id: checkin.id }),
    }).catch(() => {
      // Fire and forget — processing errors are handled in /api/process
    });

    return NextResponse.json({ checkin_id: checkin.id, status: "received" });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
