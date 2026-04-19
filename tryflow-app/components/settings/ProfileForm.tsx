"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, LogOut, Save } from "lucide-react";

interface Props {
  initialName: string;
  email: string;
  avatarUrl?: string;
}

const inputClass =
  "w-full border h-9 px-3 text-sm outline-none transition-colors focus:border-[color:var(--accent)]";

const inputStyle = {
  background: "var(--input-bg)",
  borderColor: "var(--t-input-border)",
  color: "var(--text-primary)",
};

export function ProfileForm({ initialName, email, avatarUrl }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Name cannot be empty."); return; }
    setSaving(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ data: { full_name: name.trim() } });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    router.refresh();
  }

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const initials = (name || email).slice(0, 2).toUpperCase();

  return (
    <div className="space-y-5">
      {/* Avatar + identity */}
      <div className="flex items-center gap-4">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="avatar"
            className="w-12 h-12 rounded-full object-cover"
            style={{ outline: "1px solid var(--t-border-bright)" }}
          />
        ) : (
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
            style={{ background: "var(--accent)" }}
          >
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <p
            className="text-sm font-semibold truncate"
            style={{ color: "var(--text-primary)" }}
          >
            {name || "—"}
          </p>
          <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
            {email}
          </p>
        </div>
      </div>

      {/* Edit form */}
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label
            className="block text-xs font-semibold mb-1.5"
            style={{ color: "var(--text-secondary)" }}
          >
            Display name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            className={inputClass}
            style={inputStyle}
          />
        </div>
        <div>
          <label
            className="block text-xs font-semibold mb-1.5"
            style={{ color: "var(--text-secondary)" }}
          >
            Email
          </label>
          <input
            type="email"
            value={email}
            disabled
            className={inputClass + " cursor-not-allowed opacity-60"}
            style={inputStyle}
          />
          <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
            Email is tied to your auth provider and cannot be edited here.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 h-9 px-4 text-sm font-semibold text-white transition-all disabled:opacity-50 hover:brightness-110"
            style={{ background: "var(--accent)" }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving…" : "Save changes"}
          </button>
          {saved && (
            <span className="text-xs font-medium" style={{ color: "var(--signal-success)" }}>
              Saved
            </span>
          )}
          {error && (
            <span className="text-xs" style={{ color: "var(--signal-danger)" }}>
              {error}
            </span>
          )}
        </div>
      </form>

      {/* Logout */}
      <div className="pt-4 border-t" style={{ borderColor: "var(--t-border-subtle)" }}>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors disabled:opacity-50 hover:text-[color:var(--signal-danger)]"
          style={{ color: "var(--text-tertiary)" }}
        >
          {loggingOut ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
          {loggingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </div>
  );
}
