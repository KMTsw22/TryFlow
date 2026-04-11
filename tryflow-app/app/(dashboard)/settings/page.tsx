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

  // Fetch user profile contact info
  const { data: profile } = user
    ? await supabase
        .from("user_profiles")
        .select("contact_email, contact_phone, contact_linkedin, contact_other, allow_contact")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  return (
    <div className="max-w-[720px] mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account and preferences.</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white  border border-gray-100 p-6 card-shadow">
        <h2 className="text-sm font-semibold text-gray-900 mb-5">Profile</h2>
        <ProfileForm initialName={name} email={email} avatarUrl={avatar} />
      </div>

      {/* Account Info (read-only) */}
      <div className="bg-white  border border-gray-100 p-6 card-shadow">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Account Info</h2>
        <div className="space-y-3 text-sm">
          {[
            { label: "User ID",          value: user?.id ?? "—" },
            { label: "Joined",           value: joined },
            { label: "Auth Provider",    value: provider.charAt(0).toUpperCase() + provider.slice(1) },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-gray-500">{label}</span>
              <span className="font-medium text-gray-800 font-mono text-xs">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Info */}
      <div className="bg-white  border border-gray-100 p-6 card-shadow">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">연락처 설정</h2>
        <p className="text-xs text-gray-500 mb-5">
          구독자(VC/기업)가 내 아이디어에 관심을 보일 때 사용할 연락처를 설정합니다.
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
      <div className="bg-white  border border-gray-100 p-6 card-shadow">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Preferences</h2>
        <PreferencesPanel />
      </div>

      {/* Danger Zone */}
      <div className="bg-white  border border-red-100 p-6 card-shadow">
        <h2 className="text-sm font-semibold text-red-600 mb-2">Danger Zone</h2>
        <p className="text-xs text-gray-500 mb-4">These actions are permanent and cannot be undone.</p>
        <div className="flex items-center justify-between p-3  border border-red-100 bg-red-50">
          <div>
            <p className="text-sm font-medium text-gray-900">Delete Account</p>
            <p className="text-xs text-gray-500 mt-0.5">Permanently delete your account and all project data.</p>
          </div>
          <button
            disabled
            className="shrink-0 text-xs font-semibold text-red-600 border border-red-200 px-4 py-2  hover:bg-red-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
