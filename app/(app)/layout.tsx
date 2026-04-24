import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/queries/users";
import { Sidebar } from "@/components/nav/sidebar";
import { BottomNav } from "@/components/nav/bottom-nav";
import { MobileHeader } from "@/components/nav/mobile-header";
import { parseThemeMode, THEME_COOKIE } from "@/lib/theme";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentUserProfile();
  const displayName =
    profile?.display_name ?? user.user_metadata.full_name ?? user.email ?? "Onbekend";

  const cookieStore = await cookies();
  const themeMode = parseThemeMode(cookieStore.get(THEME_COOKIE)?.value);

  return (
    <div className="flex min-h-dvh">
      <Sidebar displayName={displayName} themeMode={themeMode} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader displayName={displayName} themeMode={themeMode} />
        <main className="flex-1 pb-24 md:pb-0">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
