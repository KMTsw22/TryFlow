"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";

// 데모 단계: 인증 정보 없이도 모든 페이지에 동일 사이드바 노출.
// 랜딩(/)에서만 숨겨서 hero 가 풀폭으로 보이게 둔다.
export function SidebarWrapper() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return <Sidebar />;
}
