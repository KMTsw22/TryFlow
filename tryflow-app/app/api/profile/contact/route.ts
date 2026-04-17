import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Partial update — only apply fields explicitly present in the body so a
  // single-toggle request (e.g. {allow_contact: false}) doesn't wipe the
  // stored contact details.
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  const strField = (key: string, value: unknown) => {
    if (value === undefined) return;
    update[key] = typeof value === "string" && value.trim() ? value.trim() : null;
  };

  strField("contact_email", body.contact_email);
  strField("contact_phone", body.contact_phone);
  strField("contact_linkedin", body.contact_linkedin);
  strField("contact_other", body.contact_other);

  if (body.allow_contact !== undefined) {
    update.allow_contact = !!body.allow_contact;
  }

  const { error } = await supabase
    .from("user_profiles")
    .update(update)
    .eq("id", user.id);

  if (error) {
    console.error("[profile/contact] update error:", error);
    return NextResponse.json({ error: "Failed to update contact info" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
