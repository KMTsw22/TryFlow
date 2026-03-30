import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ notifications: [] });

  // Fetch user's experiment IDs
  const { data: experiments } = await supabase
    .from("experiments")
    .select("id, product_name")
    .eq("user_id", user.id);

  if (!experiments || experiments.length === 0) {
    return NextResponse.json({ notifications: [] });
  }

  const expIds = experiments.map(e => e.id);
  const expMap = Object.fromEntries(experiments.map(e => [e.id, e.product_name]));

  // Recent waitlist signups
  const { data: waitlist } = await supabase
    .from("waitlist_entries")
    .select("id, email, experiment_id, created_at")
    .in("experiment_id", expIds)
    .order("created_at", { ascending: false })
    .limit(5);

  // Recent comments
  const { data: comments } = await supabase
    .from("comments")
    .select("id, author_name, content, experiment_id, created_at")
    .in("experiment_id", expIds)
    .order("created_at", { ascending: false })
    .limit(5);

  type Notification = {
    id: string;
    type: "waitlist" | "comment";
    message: string;
    project: string;
    time: string;
  };

  const notifications: Notification[] = [
    ...(waitlist ?? []).map(w => ({
      id: `w-${w.id}`,
      type: "waitlist" as const,
      message: `${w.email} joined the waitlist`,
      project: expMap[w.experiment_id] ?? "Unknown",
      time: w.created_at,
    })),
    ...(comments ?? []).map(c => ({
      id: `c-${c.id}`,
      type: "comment" as const,
      message: `${c.author_name} commented: "${c.content.slice(0, 40)}${c.content.length > 40 ? "…" : ""}"`,
      project: expMap[c.experiment_id] ?? "Unknown",
      time: c.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 8);

  return NextResponse.json({ notifications });
}
