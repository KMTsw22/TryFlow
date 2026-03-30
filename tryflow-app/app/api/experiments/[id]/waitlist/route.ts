import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify ownership
  const { data: exp } = await supabase
    .from("experiments")
    .select("product_name")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!exp) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: entries } = await supabase
    .from("waitlist_entries")
    .select("email, created_at")
    .eq("experiment_id", id)
    .order("created_at", { ascending: true });

  const rows = (entries ?? []).map(e =>
    `${e.email},${new Date(e.created_at).toISOString()}`
  );
  const csv = ["email,joined_at", ...rows].join("\n");

  const filename = `${exp.product_name.toLowerCase().replace(/\s+/g, "-")}-waitlist.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
