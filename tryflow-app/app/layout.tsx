import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { NavigationProgress } from "@/components/layout/NavigationProgress";
import { SidebarWrapper } from "@/components/layout/SidebarWrapper";
import { ContentWrapper } from "@/components/layout/ContentWrapper";
import { ThemeProvider } from "@/components/ThemeProvider";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Try.Wepp — Pre-launch Market Validation",
  description:
    "Test your product before you build it. Measure real user reactions with a landing page before you launch.",
};

// Runs before React hydrates. Applies saved theme early to prevent a flash
// of the wrong theme (FOUC). Kept tiny and never throws.
const FOUC_SCRIPT = `(function(){try{var t=localStorage.getItem('trywepp_theme')||'dark';if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  let isLoggedIn = false;
  let plan: string | null = null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    isLoggedIn = !!user;
    if (user) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("plan")
        .eq("id", user.id)
        .maybeSingle();
      plan = profile?.plan ?? null;
    }
  } catch {
    // Auth or profile query failed — render as logged-out rather than crash the whole app.
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,700;0,900;1,400;1,700&family=Oswald:wght@300;500;600;700&family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Bebas+Neue&family=DM+Serif+Display:ital@0;1&family=Caveat:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {/* FOUC prevention — rendered via next/script beforeInteractive so Next
            emits it into the <head> early and React never tries to hydrate it. */}
        <Script id="trywepp-theme-fouc" strategy="beforeInteractive">
          {FOUC_SCRIPT}
        </Script>

        <ThemeProvider>
          <NavigationProgress />
          <SidebarWrapper isLoggedIn={isLoggedIn} plan={plan} />
          <ContentWrapper>{children}</ContentWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
