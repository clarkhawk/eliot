"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Download, Smartphone, ArrowRight, ShieldCheck, Zap, WifiOff } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

// ============================================================================
// CONSTANTES
// ============================================================================

const WEB_APP_HREF = "/app";

/**
 * Récupère et valide l'URL de l'APK Android.
 * @returns {string | null} URL valide ou null.
 */
function getApkUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_ANDROID_APK_URL?.trim();
  if (!url) return null;
  return /^https?:\/\//i.test(url) || url.startsWith("/") ? url : null;
}

// ============================================================================
// COMPOSANT SECONDAIRE : BADGE DE CARACTÉRISTIQUE
// ============================================================================

function FeatureBadge({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-[#0F1623]/[0.04] px-3 py-2 text-sm font-medium text-[#0F1623]/70 dark:bg-white/[0.05] dark:text-white/70">
      <Icon size={16} className="text-[#f59e0b]" />
      {text}
    </div>
  );
}

// ============================================================================
// COMPOSANT PRINCIPAL : LANDING PAGE
// ============================================================================

export function DownloadPage() {
  const apkUrl = getApkUrl();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#F1F3F5] text-[#0F1623] dark:bg-[#0A0F1A] dark:text-white">

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-in { opacity: 0; animation: fadeInUp 0.55s ease-out forwards; }
      `}} />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.18] dark:opacity-[0.08] [mask-image:radial-gradient(ellipse_65%_55%_at_50%_0%,black,transparent)]"
        style={{
          backgroundImage: "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "24px 24px"
        }}
      />

      <div className="absolute right-6 top-6 z-50">
        <ThemeToggle />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-20 lg:flex-row lg:items-center lg:gap-20 lg:py-0">

        {/* ==============================================================
            COLONNE GAUCHE — Texte et actions
        ============================================================== */}
        <main className="flex flex-1 flex-col items-start justify-center pt-8">

          {/* Logo + nom (descendu un peu via margin/padding et suppression du badge) */}
          <div className="fade-in flex items-center gap-3 mb-12" style={{ animationDelay: "0.05s" }}>
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0F1623] text-white shadow-md dark:bg-white dark:text-[#0F1623]">
              <Logo className="h-7 w-7" />
            </span>
            <span className="text-2xl font-bold tracking-tight">ÎLOT</span>
          </div>

          {/* Titre héro */}
          <h1
            className="fade-in text-[clamp(2.2rem,5vw,4.5rem)] font-extrabold leading-[1.06] tracking-tight"
            style={{ animationDelay: "0.15s" }}
          >
            <span className="block">Un salon.</span>
            <span className="block">Quelques personnes.</span>
            <span className="mt-1 block text-[#0F1623]/35 dark:text-white/35">Rien de plus.</span>
          </h1>

          {/* Description */}
          <p
            className="fade-in mt-6 max-w-[420px] text-[17px] leading-relaxed text-[#0F1623]/60 dark:text-white/60"
            style={{ animationDelay: "0.25s" }}
          >
            Configurez un espace temporaire pour échanger. Sans compte, sans cloud, sans configuration compliquée.
          </p>

          {/* Badges de caractéristiques */}
          <div className="fade-in mt-7 flex flex-wrap gap-3" style={{ animationDelay: "0.35s" }}>
            <FeatureBadge icon={WifiOff}    text="Hors-ligne" />
            <FeatureBadge icon={ShieldCheck} text="Privé" />
            <FeatureBadge icon={Zap}        text="Instantané" />
          </div>

          {/* Boutons d'action (CTA) */}
          <div className="fade-in mt-10 flex w-full flex-col gap-4 sm:flex-row" style={{ animationDelay: "0.45s" }}>
            <Link
              href={WEB_APP_HREF}
              className="group flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#0F1623] px-8 text-[15px] font-semibold text-white shadow-lg transition-all hover:bg-black active:scale-95 dark:bg-white dark:text-[#0F1623] dark:hover:bg-gray-100 w-full sm:w-auto"
            >
              Créer ou rejoindre
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </Link>

            {apkUrl ? (
              <a
                href={apkUrl}
                download
                rel="noopener"
                className="group flex h-14 items-center justify-center gap-2.5 rounded-2xl bg-[#0F1623]/[0.05] px-8 text-[15px] font-semibold text-[#0F1623] transition-all hover:bg-[#0F1623]/10 active:scale-95 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/10 w-full sm:w-auto"
              >
                <Download size={18} className="opacity-60 transition group-hover:opacity-100" />
                Télécharger l'APK
              </a>
            ) : (
              <button
                type="button"
                disabled
                aria-disabled="true"
                className="flex h-14 cursor-not-allowed items-center justify-center gap-2.5 rounded-2xl bg-[#0F1623]/[0.03] px-8 text-[15px] font-semibold text-[#0F1623]/40 dark:bg-white/[0.03] dark:text-white/40 w-full sm:w-auto"
              >
                <Smartphone size={18} className="opacity-50" />
                Android (bientôt)
              </button>
            )}
          </div>
        </main>

        {/* ==============================================================
            COLONNE DROITE — Mockup téléphone
        ============================================================== */}
        {mounted && (
          <aside
            className="fade-in relative mt-16 flex flex-1 flex-col items-center justify-center lg:mt-0"
            style={{ animationDelay: "0.3s" }}
            aria-hidden
          >
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f59e0b]/15 blur-[90px]" />

            <div className="relative w-full max-w-[270px] lg:max-w-[310px]">
              <img
                src="/mockup-hand.png"
                alt="Aperçu de l'application Îlot"
                className="relative z-20 h-auto w-full"
              />
            </div>
            
            {/* Bouton additionnel sous le téléphone */}
            <div className="mt-8 z-20">
              <Link
                href={WEB_APP_HREF}
                className="group flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-[14px] font-bold text-[#0F1623] shadow-md border border-[#0F1623]/5 transition-all hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 dark:bg-[#1E293B] dark:text-white dark:border-white/10"
              >
                Ouvrir la version web
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1 opacity-50" />
              </Link>
            </div>
          </aside>
        )}

      </div>
    </div>
  );
}

export default DownloadPage;
