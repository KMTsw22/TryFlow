"use client";

import { Bell, HelpCircle, Search } from "lucide-react";
import Image from "next/image";

interface TopBarProps {
  userName?: string;
  userImage?: string;
}

export function TopBar({ userName = "User", userImage }: TopBarProps) {
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center px-6 gap-4 sticky top-0 z-20">
      <div className="relative w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input
          placeholder="Search experiments..."
          className="w-full h-9 pl-9 pr-3 bg-gray-50 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
        />
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <button className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-purple-600 rounded-full" />
        </button>
        <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <HelpCircle className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 pl-3 ml-1 border-l border-gray-100">
          {userImage ? (
            <Image
              src={userImage}
              alt={userName}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>
          )}
          <div className="leading-none">
            <p className="text-sm font-semibold text-gray-900 max-w-[120px] truncate">{userName}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Pro Plan</p>
          </div>
        </div>
      </div>
    </header>
  );
}
