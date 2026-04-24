import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Met Liefde",
  description: "Gedeeld factuur- en abonnementenbeheer voor Rutger en Annelie.",
  applicationName: "Met Liefde",
  appleWebApp: {
    capable: true,
    title: "Met Liefde",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#f5f3ef",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
