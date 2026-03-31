"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Bell, HelpCircle, Search, Mail, MessageSquare, ExternalLink, BookOpen, BarChart3, Plus, Zap, X, Coins } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

type SearchResult = { id: string; slug: string; product_name: string; category: string; maker_name: string };

interface TopBarProps {
  userName?: string;
  userImage?: string;
  creditBalance?: number;
}

type Notification = {
  id: string;
  type: "waitlist" | "comment";
  message: string;
  project: string;
  time: string;
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function TopBar({ userName = "User", userImage, creditBalance = 0 }: TopBarProps) {
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const router = useRouter();
  const [notifOpen, setNotifOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [hasNew, setHasNew] = useState(true);

  // Search state
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const notifRef = useRef<HTMLDivElement>(null);
  const helpRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (helpRef.current && !helpRef.current.contains(e.target as Node)) setHelpOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 1) { setSearchResults([]); setSearchOpen(false); return; }
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setSearchResults(data.results ?? []);
    setSearchOpen(true);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => doSearch(query), 250);
    return () => clearTimeout(t);
  }, [query, doSearch]);

  async function openNotif() {
    if (!notifOpen) {
      setNotifLoading(true);
      setHasNew(false);
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setNotifLoading(false);
    }
    setNotifOpen(v => !v);
    setHelpOpen(false);
  }

  function openHelp() {
    setHelpOpen(v => !v);
    setNotifOpen(false);
  }

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center px-6 gap-4 sticky top-0 z-20">
      {/* ── Search ── */}
      <div className="relative w-64" ref={searchRef}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && searchResults[0]) { router.push(`/${searchResults[0].slug}`); setSearchOpen(false); setQuery(""); } }}
          placeholder="Search projects..."
          className="w-full h-9 pl-9 pr-3 bg-gray-50 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
        />
        {searchOpen && searchResults.length > 0 && (
          <div className="absolute top-10 left-0 w-72 bg-white rounded-xl border border-gray-100 shadow-xl py-1.5 z-50 overflow-hidden">
            {searchResults.map(r => (
              <button key={r.id} onClick={() => { router.push(`/${r.slug}`); setSearchOpen(false); setQuery(""); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left">
                <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-700 shrink-0">
                  {r.product_name[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{r.product_name}</p>
                  <p className="text-[10px] text-gray-400">{r.category}{r.maker_name ? ` · ${r.maker_name}` : ""}</p>
                </div>
              </button>
            ))}
          </div>
        )}
        {searchOpen && query.length > 0 && searchResults.length === 0 && (
          <div className="absolute top-10 left-0 w-72 bg-white rounded-xl border border-gray-100 shadow-xl py-4 text-center z-50">
            <p className="text-xs text-gray-400">No projects found for &ldquo;{query}&rdquo;</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 ml-auto">

        {/* ── Bell ── */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={openNotif}
            className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {hasNew && <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-purple-600 rounded-full" />}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-11 z-50 w-80 bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900">Notifications</p>
                <button onClick={() => setNotifOpen(false)}><X className="w-3.5 h-3.5 text-gray-400" /></button>
              </div>

              {notifLoading ? (
                <div className="px-4 py-8 text-center text-xs text-gray-400">Loading…</div>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <Bell className="w-6 h-6 mx-auto text-gray-300 mb-2" />
                  <p className="text-xs text-gray-400">No activity yet.</p>
                  <p className="text-[11px] text-gray-300 mt-1">Share your project to get visitors!</p>
                </div>
              ) : (
                <ul className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                  {notifications.map(n => (
                    <li key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${n.type === "waitlist" ? "bg-green-100" : "bg-blue-100"}`}>
                        {n.type === "waitlist"
                          ? <Mail className="w-3.5 h-3.5 text-green-600" />
                          : <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-700 leading-snug">{n.message}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-purple-600 font-medium truncate">{n.project}</span>
                          <span className="text-[10px] text-gray-400">{timeAgo(n.time)}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="border-t border-gray-100 px-4 py-2.5">
                <Link href="/analytics" onClick={() => setNotifOpen(false)}
                  className="flex items-center justify-center gap-1 text-xs text-purple-600 font-medium hover:text-purple-700">
                  View all analytics <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* ── Help ── */}
        <div className="relative" ref={helpRef}>
          <button
            onClick={openHelp}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {helpOpen && (
            <div className="absolute right-0 top-11 z-50 w-72 bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900">Quick Help</p>
                <button onClick={() => setHelpOpen(false)}><X className="w-3.5 h-3.5 text-gray-400" /></button>
              </div>

              <div className="p-3 space-y-1">
                {[
                  { icon: <Plus className="w-3.5 h-3.5 text-purple-500" />, label: "Create a project", desc: "Share your idea in 5 minutes", href: "/experiments/new" },
                  { icon: <BarChart3 className="w-3.5 h-3.5 text-blue-500" />, label: "View analytics", desc: "Track visitors & conversions", href: "/analytics" },
                  { icon: <BookOpen className="w-3.5 h-3.5 text-green-500" />, label: "How try.wepp works", desc: "Validate before you build", href: "/" },
                  { icon: <Zap className="w-3.5 h-3.5 text-amber-500" />, label: "Explore community", desc: "See what others are building", href: "/explore" },
                ].map(item => (
                  <Link key={item.href} href={item.href} onClick={() => setHelpOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group">
                    <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 group-hover:bg-white transition-colors">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-800">{item.label}</p>
                      <p className="text-[11px] text-gray-400">{item.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="border-t border-gray-100 px-4 py-3">
                <p className="text-[11px] text-gray-400 text-center">
                  Need more help?{" "}
                  <a href="mailto:support@tryflow.app" className="text-purple-600 font-medium hover:underline">
                    Contact support
                  </a>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Credit Balance ── */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
          <Coins className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="text-xs font-bold text-amber-700">{creditBalance.toLocaleString()}</span>
          <span className="text-[10px] text-amber-500 font-medium">크레딧</span>
        </div>

        {/* ── Avatar ── */}
        <div className="flex items-center gap-2.5 pl-3 ml-1 border-l border-gray-100">
          {userImage ? (
            <Image src={userImage} alt={userName} width={32} height={32} className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>
          )}
          <div className="leading-none">
            <p className="text-sm font-semibold text-gray-900 max-w-[120px] truncate">{userName}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Free Plan</p>
          </div>
        </div>
      </div>
    </header>
  );
}
