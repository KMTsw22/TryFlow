import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { PreferencesPanel } from "@/components/settings/PreferencesPanel";
import { ContactInfoForm } from "@/components/settings/ContactInfoForm";
import { PageHeader } from "@/components/ui/PageHeader";

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

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <PageHeader
        title="Settings"
        description="Manage your profile, contact preferences, and account."
      />

      <div className="space-y-8">
        <Section
          title="Profile"
          description="Your public display name and email."
        >
          <ProfileForm initialName={name} email={email} avatarUrl={avatar} />
        </Section>

        <Section
          title="Account info"
          description="Read-only details tied to your authentication."
        >
          <dl className="text-sm">
            {[
              { label: "User ID",       value: user?.id ?? "—", mono: true },
              { label: "Joined",        value: joined, mono: false },
              { label: "Auth provider", value: provider.charAt(0).toUpperCase() + provider.slice(1), mono: false },
            ].map(({ label, value, mono }, i, arr) => (
              <div
                key={label}
                className="flex items-center justify-between py-3 border-b"
                style={{
                  borderColor: i === arr.length - 1 ? "transparent" : "var(--t-border-subtle)",
                }}
              >
                <dt style={{ color: "var(--text-tertiary)" }}>{label}</dt>
                <dd
                  className={mono ? "font-mono text-xs" : "text-sm"}
                  style={{ color: "var(--text-secondary)" }}
                >
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section
          title="Contact preferences"
          description="Set how Pro investors and collaborators can reach you about ideas you've submitted."
        >
          <ContactInfoForm
            initialEmail={profile?.contact_email ?? email}
            initialPhone={profile?.contact_phone ?? ""}
            initialLinkedin={profile?.contact_linkedin ?? ""}
            initialOther={profile?.contact_other ?? ""}
            initialAllowContact={profile?.allow_contact ?? false}
          />
        </Section>

        <Section
          title="Preferences"
          description="Interface and notification settings."
        >
          <PreferencesPanel />
        </Section>

        {/* Danger zone — visually distinct but restrained */}
        <div
          className="border p-6"
          style={{
            background: "var(--card-bg)",
            borderColor: "rgba(239, 68, 68, 0.25)",
          }}
        >
          <div className="mb-4">
            <h2
              className="text-sm font-semibold"
              style={{ color: "var(--signal-danger, #ef4444)" }}
            >
              Danger zone
            </h2>
            <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
              These actions are permanent and cannot be undone.
            </p>
          </div>

          <div
            className="flex items-center justify-between gap-4 p-4 border"
            style={{
              borderColor: "rgba(239, 68, 68, 0.18)",
              background: "rgba(239, 68, 68, 0.04)",
            }}
          >
            <div>
              <p
                className="text-sm font-semibold mb-0.5"
                style={{ color: "var(--text-primary)" }}
              >
                Delete account
              </p>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Permanently delete your account and all submitted ideas.
              </p>
            </div>
            <button
              disabled
              title="Contact support to delete your account"
              className="shrink-0 h-9 px-4 text-xs font-semibold border transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-500/10"
              style={{
                color: "var(--signal-danger, #ef4444)",
                borderColor: "rgba(239, 68, 68, 0.3)",
              }}
            >
              Delete account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Section wrapper ──────────────────────────────────────────────────────────
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
      <div className="md:pt-1">
        <h2
          className="text-sm font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          {title}
        </h2>
        {description && (
          <p
            className="text-xs mt-1 leading-relaxed"
            style={{ color: "var(--text-tertiary)" }}
          >
            {description}
          </p>
        )}
      </div>
      <div
        className="border p-5"
        style={{
          background: "var(--card-bg)",
          borderColor: "var(--t-border-card)",
        }}
      >
        {children}
      </div>
    </section>
  );
}
