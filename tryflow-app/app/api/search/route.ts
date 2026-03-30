import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 1) return NextResponse.json({ results: [] });

  const supabase = await createClient();
  const { data } = await supabase
    .from("experiments")
    .select("id, slug, product_name, category, maker_name")
    .eq("status", "RUNNING")
    .ilike("product_name", `%${q}%`)
    .limit(6);

  return NextResponse.json({ results: data ?? [] });
}
