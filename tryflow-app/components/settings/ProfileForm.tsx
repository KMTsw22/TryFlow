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
      {/* Avatar + name */}
      <div className="flex items-center gap-4">
        {avatarUrl ? (
          <img src={avatarUrl} alt="avatar" className="w-16 h-16 rounded-full object-cover ring-2 ring-purple-200" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xl font-bold">
            {initials}
          </div>
        )}
        <div>
          <p className="font-semibold text-gray-900">{name || "—"}</p>
          <p className="text-sm text-gray-400">{email}</p>
          <p className="text-xs text-gray-400 mt-0.5">Signed in with Google</p>
        </div>
      </div>

      {/* Edit name */}
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Display Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full border border-gray-100 rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
          />
          <p className="text-xs text-gray-400 mt-1">Email cannot be changed for Google accounts.</p>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-gradient-primary text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
          {saved && <span className="text-xs text-green-600 font-medium">Saved!</span>}
          {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
      </form>

      {/* Logout */}
      <div className="pt-2 border-t border-gray-100">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="inline-flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50 transition-colors"
        >
          {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
          {loggingOut ? "Signing out..." : "Sign Out"}
        </button>
      </div>
    </div>
  );
}
