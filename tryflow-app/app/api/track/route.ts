import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { experimentId, eventType, metadata } = await req.json();
    if (!experimentId || !eventType) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const supabase = await createClient();
    await supabase
      .from("click_events")
      .insert({ experiment_id: experimentId, event_type: eventType, metadata: metadata ?? {} });

    // Increment total_visitors only for page_view
    if (eventType === "page_view") {
      const { data: exp } = await supabase
        .from("experiments")
        .select("total_visitors")
        .eq("id", experimentId)
        .single();
      if (exp) {
        await supabase
          .from("experiments")
          .update({ total_visitors: (exp.total_visitors ?? 0) + 1 })
          .eq("id", experimentId);
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
