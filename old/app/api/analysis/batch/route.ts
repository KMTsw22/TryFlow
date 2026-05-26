import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();

    // 분석 없는 아이디어 ID 목록 조회
    const { data: ideas, error } = await supabase
      .from("idea_submissions")
      .select("id")
      .order("created_at", { ascending: true });

    if (error) throw error;

    const { data: analyzed } = await supabase
      .from("analysis_reports")
      .select("submission_id");

    const analyzedIds = new Set((analyzed ?? []).map((r) => r.submission_id));
    const missing = (ideas ?? []).filter((i) => !analyzedIds.has(i.id));

    if (missing.length === 0) {
      return NextResponse.json({ message: "모두 분석 완료", processed: 0 });
    }

    // NEXT_PUBLIC_SITE_URL (수동) → VERCEL_URL (자동) → localhost
    const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? vercelUrl ?? "http://localhost:3000";

    const results: { id: string; status: string; error?: string }[] = [];

    for (const idea of missing) {
      try {
        const res = await fetch(`${baseUrl}/api/analysis`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ submissionId: idea.id }),
        });

        if (res.status === 409) {
          results.push({ id: idea.id, status: "already_exists" });
        } else if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          results.push({ id: idea.id, status: "error", error: body.error ?? res.statusText });
        } else {
          results.push({ id: idea.id, status: "ok" });
        }
      } catch (err) {
        results.push({ id: idea.id, status: "error", error: String(err) });
      }
    }

    const succeeded = results.filter((r) => r.status === "ok").length;
    const failed = results.filter((r) => r.status === "error").length;

    return NextResponse.json({ processed: missing.length, succeeded, failed, results });
  } catch (err) {
    console.error("POST /api/analysis/batch", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}