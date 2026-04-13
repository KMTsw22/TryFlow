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

const inputClass = "w-full border px-3 py-2.5 text-sm text-gray-300 placeholder-gray-600 outline-none focus:border-indigo-500/50 transition-colors";
const inputStyle = { background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" };

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
    <div className="space-y-6">
      {/* Avatar + info */}
      <div className="flex items-center gap-4">
        {avatarUrl ? (
          <img src={avatarUrl} alt="avatar" className="w-14 h-14 rounded-full object-cover ring-2 ring-indigo-500/30" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-indigo-500 flex items-center justify-center text-white text-lg font-bold shrink-0">
            {initials}
          </div>
        )}
        <div>
          <p className="font-semibold text-white">{name || "—"}</p>
          <p className="text-sm text-gray-500">{email}</p>
          <p className="text-xs text-gray-600 mt-0.5">Signed in with Google</p>
        </div>
      </div>

      {/* Edit form */}
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Display Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            maxLength={50} className={inputClass} style={inputStyle} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email</label>
          <input type="email" value={email} disabled
            className={inputClass + " cursor-not-allowed opacity-50"} style={inputStyle} />
          <p className="text-xs text-gray-600 mt-1">Email cannot be changed for Google accounts.</p>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button type="submit" disabled={saving}
            className="inline-flex items-center gap-2 bg-indigo-500 text-white text-sm font-bold px-5 py-2.5 hover:bg-indigo-400 disabled:opacity-50 transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
          {saved && <span className="text-xs text-emerald-400 font-medium">Saved!</span>}
          {error && <span className="text-xs text-red-400">{error}</span>}
        </div>
      </form>

      {/* Logout */}
      <div className="pt-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <button onClick={handleLogout} disabled={loggingOut}
          className="inline-flex items-center gap-2 text-sm font-medium text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors">
          {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
          {loggingOut ? "Signing out..." : "Sign Out"}
        </button>
      </div>
    </div>
  );
}
