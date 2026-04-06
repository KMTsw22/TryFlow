import type { Metadata } from "next";
import "./globals.css";
import { NavigationProgress } from "@/components/layout/NavigationProgress";
import { SidebarWrapper } from "@/components/layout/SidebarWrapper";
import { ContentWrapper } from "@/components/layout/ContentWrapper";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Rabbit Hole — Where Ideas Fall Into Something Real",
  description:
    "Test your product before you build it. Measure real user reactions with a landing page before you launch.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <NavigationProgress />
        <SidebarWrapper isLoggedIn={isLoggedIn} />
        <ContentWrapper>{children}</ContentWrapper>
      </body>
    </html>
  );
}
