"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";

export function SidebarWrapper({ isLoggedIn, plan }: { isLoggedIn: boolean; plan: string | null }) {
  const pathname = usePathname();

  if (pathname === "/") return null;

  return <Sidebar isLoggedIn={isLoggedIn} plan={plan} />;
}
