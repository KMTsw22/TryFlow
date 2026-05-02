import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "user-intro-videos";
const MAX_DURATION_SECONDS = 100;

/**
 * POST /api/profile/video — register an already-uploaded intro video.
 *
 * The client uploads the file directly to Supabase Storage (RLS gates writes
 * to the user's own folder). This endpoint then validates the metadata and
 * persists `intro_video_url` + `intro_video_duration_seconds` on the profile.
 *
 * Going through Storage directly keeps the 100MB payload off our serverless
 * routes (Vercel caps request bodies at ~4.5MB).
 *
 * Body: { storage_path: string, duration_seconds: number }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const storagePath = typeof body.storage_path === "string" ? body.storage_path : "";
  const duration = Number(body.duration_seconds);

  // Path must start with the caller's uid — defends against someone pointing
  // their profile at another user's uploaded file.
  if (!storagePath || !storagePath.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: "Invalid storage path" }, { status: 400 });
  }
  if (!Number.isFinite(duration) || duration <= 0 || duration > MAX_DURATION_SECONDS) {
    return NextResponse.json(
      { error: `Duration must be between 1 and ${MAX_DURATION_SECONDS} seconds` },
      { status: 400 }
    );
  }

  // Confirm the object actually exists in storage before writing the URL.
  const { data: objectInfo, error: statErr } = await supabase
    .storage
    .from(BUCKET)
    .list(user.id, { search: storagePath.slice(user.id.length + 1) });

  if (statErr || !objectInfo || objectInfo.length === 0) {
    return NextResponse.json({ error: "Uploaded file not found" }, { status: 400 });
  }

  const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

  // Replace any previous video so we don't accumulate dead files.
  const { data: existing } = await supabase
    .from("user_profiles")
    .select("intro_video_url")
    .eq("id", user.id)
    .maybeSingle();

  const previousPath = existing?.intro_video_url
    ? extractStoragePath(existing.intro_video_url)
    : null;
  if (previousPath && previousPath !== storagePath) {
    await supabase.storage.from(BUCKET).remove([previousPath]);
  }

  const { error: updateErr } = await supabase
    .from("user_profiles")
    .update({
      intro_video_url: publicUrl.publicUrl,
      intro_video_duration_seconds: Math.round(duration),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (updateErr) {
    console.error("[profile/video] update error:", updateErr);
    return NextResponse.json({ error: "Failed to save video" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    intro_video_url: publicUrl.publicUrl,
    intro_video_duration_seconds: Math.round(duration),
  });
}

/**
 * DELETE /api/profile/video — remove the user's intro video (file + DB row).
 */
export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: existing } = await supabase
    .from("user_profiles")
    .select("intro_video_url")
    .eq("id", user.id)
    .maybeSingle();

  const path = existing?.intro_video_url
    ? extractStoragePath(existing.intro_video_url)
    : null;

  if (path) {
    await supabase.storage.from(BUCKET).remove([path]);
  }

  const { error: updateErr } = await supabase
    .from("user_profiles")
    .update({
      intro_video_url: null,
      intro_video_duration_seconds: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (updateErr) {
    console.error("[profile/video] delete error:", updateErr);
    return NextResponse.json({ error: "Failed to delete video" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// publicUrl looks like ".../storage/v1/object/public/user-intro-videos/<uid>/<file>"
function extractStoragePath(url: string): string | null {
  const marker = `/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}
