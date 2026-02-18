import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, arrived_at } = body;

    if (!user_id || !arrived_at) {
      return NextResponse.json(
        { error: "Missing required fields: user_id, arrived_at" },
        { status: 400 }
      );
    }

    const { data: session, error } = await supabase
      .from("presence_sessions")
      .insert({ user_id, arrived_at })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ session_id: session.id });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, departed_at } = body;

    if (!session_id || !departed_at) {
      return NextResponse.json(
        { error: "Missing required fields: session_id, departed_at" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("presence_sessions")
      .update({ departed_at })
      .eq("id", session_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ status: "ended" });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
