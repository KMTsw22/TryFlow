import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const [expRes, waitlistRes, eventsRes] = await Promise.all([
    supabase.from("experiments").select("total_visitors").eq("id", id).single(),
    supabase.from("waitlist_entries").select("id", { count: "exact" }).eq("experiment_id", id),
    supabase.from("click_events").select("event_type, metadata").eq("experiment_id", id),
  ]);

  if (expRes.error) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const totalVisitors = expRes.data.total_visitors ?? 0;
  const waitlistCount = waitlistRes.count ?? 0;
  const events = eventsRes.data ?? [];

  const planClickCounts: Record<string, number> = {};
  const featureVoteCounts: Record<string, number> = {};

  for (const e of events) {
    if (e.event_type === "pricing_click") {
      const plan = (e.metadata as Record<string, string>)?.planName ?? "unknown";
      planClickCounts[plan] = (planClickCounts[plan] ?? 0) + 1;
    }
    if (e.event_type === "feature_vote") {
      const fid = (e.metadata as Record<string, string>)?.featureId ?? "unknown";
      featureVoteCounts[fid] = (featureVoteCounts[fid] ?? 0) + 1;
    }
  }

  const conversionRate = totalVisitors > 0
    ? Math.round((waitlistCount / totalVisitors) * 1000) / 10
    : 0;

  return NextResponse.json({
    totalVisitors,
    waitlistCount,
    conversionRate,
    planClickCounts,
    featureVoteCounts,
    totalEvents: events.length,
  });
}
