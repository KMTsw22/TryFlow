import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { contact_email, contact_phone, contact_linkedin, contact_other, allow_contact } =
    await request.json();

  const { error } = await supabase
    .from("user_profiles")
    .update({
      contact_email: contact_email?.trim() || null,
      contact_phone: contact_phone?.trim() || null,
      contact_linkedin: contact_linkedin?.trim() || null,
      contact_other: contact_other?.trim() || null,
      allow_contact: !!allow_contact,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("[profile/contact] update error:", error);
    return NextResponse.json({ error: "Failed to update contact info" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
