// 2026-05 — Fastlane 피벗 후 /dashboard 의 옛 TryFlow(ideas) UI 는 사용 X.
// 기존 진입점(로그인 default redirect, 외부 링크 등) 호환을 위해 라우트 자체는
// 남겨두되, 즉시 /competitions 으로 보낸다.
//
// 옛 코드(IdeaGrid 기반)는 git 히스토리에 남아있고, 필요 시 그 시점으로
// checkout 해서 복구 가능.

import { redirect } from "next/navigation";

export default function DashboardPage() {
  redirect("/competitions");
}
