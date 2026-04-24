import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * PATCH /api/profile — public profile fields update.
 *
 * Separated from /api/profile/contact so the public-facing fields (bio, social
 * links, anonymity toggle) and the contact preferences (email/phone/allow_contact)
 * can be updated independently without overwriting each other.
 *
 * Field length caps mirror the DB CHECK constraints in db/profile_fields.sql.
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  // Trim strings; empty string → null so the DB stays clean.
  const strField = (key: string, value: unknown, maxLen: number) => {
    if (value === undefined) return;
    if (typeof value !== "string") {
      update[key] = null;
      return;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      update[key] = null;
      return;
    }
    if (trimmed.length > maxLen) {
      update[key] = trimmed.slice(0, maxLen);
      return;
    }
    update[key] = trimmed;
  };

  strField("bio", body.bio, 200);
  strField("twitter_url", body.twitter_url, 300);
  strField("github_url", body.github_url, 300);
  strField("website_url", body.website_url, 300);
  // contact_linkedin is shared with contact route — accept here too so the
  // public profile section can edit it without round-tripping through contact.
  strField("contact_linkedin", body.linkedin_url, 300);

  if (body.profile_anonymous !== undefined) {
    update.profile_anonymous = !!body.profile_anonymous;
  }

  const { error } = await supabase
    .from("user_profiles")
    .update(update)
    .eq("id", user.id);

  if (error) {
    console.error("[profile] update error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
