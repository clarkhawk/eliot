import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { BOOT_SCRIPT } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "Îlot",
  description: "Messagerie offline en réseau local — créez un salon, partagez un QR code, discutez sans internet.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F1F3F5" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0F1A" },
  ],
};

/**
 * Layout racine global.
 * L'AppShell est intentionnellement absent ici.
 * Il est appliqué uniquement dans le groupe (shell)
 * pour les routes /app, /create, /join, /room.
 * La landing page (/) s'affiche donc en plein écran sur tous les appareils.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning className={`overscroll-none ${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
      </head>
      <body className="overscroll-none bg-[#F1F3F5] dark:bg-[#0A0F1A]">
        {children}
      </body>
    </html>
  );
}
