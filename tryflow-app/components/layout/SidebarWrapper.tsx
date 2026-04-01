"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";

export function SidebarWrapper({ isLoggedIn }: { isLoggedIn: boolean }) {
  const pathname = usePathname();

  if (pathname === "/") return null;

  return <Sidebar isLoggedIn={isLoggedIn} />;
}
