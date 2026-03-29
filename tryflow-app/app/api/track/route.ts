import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { experimentId, eventType, metadata } = await req.json();
    if (!experimentId || !eventType) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("click_events")
      .insert({ experiment_id: experimentId, event_type: eventType, metadata: metadata ?? {} });

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
