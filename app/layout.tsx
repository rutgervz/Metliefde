import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import {
  getEffectiveTheme,
  parseThemeMode,
  THEME_COOKIE,
} from "@/lib/theme";

export const metadata: Metadata = {
  title: "Met Liefde",
  description: "Gedeeld factuur- en abonnementenbeheer voor Rutger en Annelie.",
  applicationName: "Met Liefde",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Met Liefde",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f3ef" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1614" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const mode = parseThemeMode(cookieStore.get(THEME_COOKIE)?.value);
  const effective = getEffectiveTheme(mode);

  return (
    <html lang="nl" data-theme={effective} data-theme-mode={mode}>
      <body>{children}</body>
    </html>
  );
}
