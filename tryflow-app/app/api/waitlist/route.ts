import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { email, experimentId } = await req.json();
    if (!email || !experimentId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const supabase = await createClient();

    // upsert (ignore duplicate emails)
    const { error } = await supabase
      .from("waitlist_entries")
      .upsert({ experiment_id: experimentId, email }, { onConflict: "experiment_id,email" });

    if (error) throw error;

    // Record event
    await supabase
      .from("click_events")
      .insert({ experiment_id: experimentId, event_type: "waitlist_submit", metadata: { email } });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
