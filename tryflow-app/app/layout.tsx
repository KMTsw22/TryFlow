import type { Metadata } from "next";
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
        {/* Prevent FOUC: apply saved theme before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('trywepp_theme')||'dark';if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,700;0,900;1,400;1,700&family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Bebas+Neue&family=DM+Serif+Display:ital@0;1&family=Caveat:wght@400;700&family=Oswald:wght@200;300;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeProvider>
          <NavigationProgress />
          <SidebarWrapper isLoggedIn={isLoggedIn} plan={plan} />
          <ContentWrapper>{children}</ContentWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
