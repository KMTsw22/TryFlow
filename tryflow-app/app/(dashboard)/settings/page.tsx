import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { PreferencesPanel } from "@/components/settings/PreferencesPanel";
import { ContactInfoForm } from "@/components/settings/ContactInfoForm";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const name     = user?.user_metadata?.full_name ?? "";
  const email    = user?.email ?? "";
  const avatar   = user?.user_metadata?.avatar_url;
  const provider = user?.app_metadata?.provider ?? "email";
  const joined   = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "—";

  const { data: profile } = user
    ? await supabase
        .from("user_profiles")
        .select("contact_email, contact_phone, contact_linkedin, contact_other, allow_contact")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  const card = "border p-6" as const;
  const cardStyle = { background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" };

  return (
    <div className="max-w-[720px] mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account and preferences.</p>
      </div>

      {/* Profile */}
      <div className={card} style={cardStyle}>
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-5">Profile</h2>
        <ProfileForm initialName={name} email={email} avatarUrl={avatar} />
      </div>

      {/* Account Info */}
      <div className={card} style={cardStyle}>
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Account Info</h2>
        <div className="space-y-0 text-sm">
          {[
            { label: "User ID",       value: user?.id ?? "—" },
            { label: "Joined",        value: joined },
            { label: "Auth Provider", value: provider.charAt(0).toUpperCase() + provider.slice(1) },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-3 border-b last:border-0"
              style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              <span className="text-gray-500">{label}</span>
              <span className="font-mono text-xs text-gray-300">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Info */}
      <div className={card} style={cardStyle}>
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Contact Settings</h2>
        <p className="text-xs text-gray-600 mb-5">
          Set the contact info subscribers (VCs/companies) can use when they&apos;re interested in your idea.
        </p>
        <ContactInfoForm
          initialEmail={profile?.contact_email ?? email}
          initialPhone={profile?.contact_phone ?? ""}
          initialLinkedin={profile?.contact_linkedin ?? ""}
          initialOther={profile?.contact_other ?? ""}
          initialAllowContact={profile?.allow_contact ?? false}
        />
      </div>

      {/* Preferences */}
      <div className={card} style={cardStyle}>
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Preferences</h2>
        <PreferencesPanel />
      </div>

      {/* Danger Zone */}
      <div className="border p-6" style={{ background: "rgba(239,68,68,0.04)", borderColor: "rgba(239,68,68,0.15)" }}>
        <h2 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-2">Danger Zone</h2>
        <p className="text-xs text-gray-600 mb-4">These actions are permanent and cannot be undone.</p>
        <div className="flex items-center justify-between p-4 border" style={{ borderColor: "rgba(239,68,68,0.15)", background: "rgba(239,68,68,0.04)" }}>
          <div>
            <p className="text-sm font-medium text-white">Delete Account</p>
            <p className="text-xs text-gray-500 mt-0.5">Permanently delete your account and all project data.</p>
          </div>
          <button disabled
            className="shrink-0 text-xs font-semibold text-red-400 border border-red-500/30 px-4 py-2 hover:bg-red-500/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
