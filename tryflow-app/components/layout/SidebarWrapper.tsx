"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";

export function SidebarWrapper({
  isLoggedIn,
  plan,
  role,
}: {
  isLoggedIn: boolean;
  plan: string | null;
  role?: "founder" | "investor";
}) {
  const pathname = usePathname();

  if (pathname === "/") return null;

  return <Sidebar isLoggedIn={isLoggedIn} plan={plan} role={role} />;
}
