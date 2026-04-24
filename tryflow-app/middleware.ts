import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session (must call getUser)
  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Protect dashboard routes — redirect to /login if not authenticated
  const isDashboardRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/analytics") ||
    pathname.startsWith("/settings");

  if (isDashboardRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from /login to their role-appropriate home.
  // 2026-04 identity split: Pro(investor) → Market, else → Dashboard.
  if (pathname === "/login" && user) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("plan")
      .eq("id", user.id)
      .maybeSingle();
    const url = request.nextUrl.clone();
    url.pathname = profile?.plan === "pro" ? "/explore" : "/dashboard";
    return NextResponse.redirect(url);
  }

  // /explore 접근 정책 (2026-04 paywall softening):
  //   /explore           → 모든 로그인 유저. 페이지 안에서 teaser + muted 패턴.
  //   /explore/[cat]/... → Pro 전용. Free/Plus 는 /pricing 으로.
  if (pathname.startsWith("/explore")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    if (pathname !== "/explore") {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("plan")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.plan !== "pro") {
        const url = request.nextUrl.clone();
        url.pathname = "/pricing";
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
