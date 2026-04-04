import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const now = new Date();
    const d30  = new Date(now); d30.setDate(now.getDate() - 30);
    const d7   = new Date(now); d7.setDate(now.getDate() - 7);
    const d14  = new Date(now); d14.setDate(now.getDate() - 14);

    // All categories
    const CATEGORIES = [
      "SaaS / B2B", "Consumer App", "Marketplace", "Dev Tools",
      "Health & Wellness", "Education", "Social / Community", "Fintech",
      "E-commerce", "AI / ML", "Hardware", "Other",
    ];

    // Total submissions per category (all time)
    const { data: allTime } = await supabase
      .from("idea_submissions")
      .select("category");

    // Last 30 days
    const { data: month30 } = await supabase
      .from("idea_submissions")
      .select("category")
      .gte("created_at", d30.toISOString());

    // Last 7 days
    const { data: week1 } = await supabase
      .from("idea_submissions")
      .select("category")
      .gte("created_at", d7.toISOString());

    // Previous 7 days
    const { data: week2 } = await supabase
      .from("idea_submissions")
      .select("category")
      .gte("created_at", d14.toISOString())
      .lt("created_at", d7.toISOString());

    const count = (rows: { category: string }[] | null, cat: string) =>
      (rows ?? []).filter((r) => r.category === cat).length;

    const trends = CATEGORIES.map((cat) => {
      const total   = count(allTime, cat);
      const last30  = count(month30, cat);
      const last7   = count(week1, cat);
      const prev7   = count(week2, cat);

      let direction: "Rising" | "Stable" | "Declining";
      if (last7 > (prev7 || 0) * 1.25 || (prev7 === 0 && last7 >= 1)) {
        direction = "Rising";
      } else if (last7 < (prev7 || 1) * 0.75) {
        direction = "Declining";
      } else {
        direction = "Stable";
      }

      let saturation: "Low" | "Medium" | "High";
      if (last30 <= 4)       saturation = "Low";
      else if (last30 <= 12) saturation = "Medium";
      else                   saturation = "High";

      return { category: cat, total, last30, last7, direction, saturation };
    }).sort((a, b) => b.last30 - a.last30);

    const totalSubmissions = (allTime ?? []).length;

    return NextResponse.json({ trends, totalSubmissions });
  } catch (err) {
    console.error("GET /api/trends", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}