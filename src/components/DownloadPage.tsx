import Link from "next/link";
import { Clock, Download, Smartphone } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const APP_VERSION = "0.1.0";
const WEB_APP_HREF = "/app";

/** Lien APK public (NEXT_PUBLIC_ANDROID_APK_URL). Ignoré s'il est vide ou invalide. */
function getApkUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_ANDROID_APK_URL?.trim();
  if (!url) return null;
  return /^https?:\/\//i.test(url) || url.startsWith("/") ? url : null;
}

const YELLOW = "bg-[#f7c948] text-[#0f1623]";

export function DownloadPage() {
  const apkUrl = getApkUrl();

  return (
    // `fixed inset-0` : la page occupe tout le viewport et sort du cadre « téléphone »
    // (AppShell) du layout racine ; elle recouvre aussi le splash de l'app.
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-[#f8f6ef] text-ink dark:bg-[#0e1522]">
      {/* Grille discrète, estompée vers le bas */}
      <div
        aria-hidden
        className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_70%_55%_at_50%_0%,black,transparent)]"
      />

      <div className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-10">
        <ThemeToggle />
      </div>

      <div className="relative mx-auto flex min-h-full w-full max-w-3xl flex-col items-center px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(4rem,env(safe-area-inset-top))] text-center sm:pt-24">
        <main className="flex w-full flex-1 flex-col items-center justify-center py-8">
          {/* Logo + nom */}
          <div className="flex items-center gap-3">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-ink/10 bg-white/70 dark:bg-white/[0.06]">
              <Logo className="h-9 w-9 text-ink" />
            </span>
            <span className="text-[28px] font-bold tracking-tight">Îlot</span>
          </div>

          {/* Badge */}
          <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/60 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-ink/70 dark:bg-white/[0.05]">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[#f7c948]" />
            Messagerie locale
          </p>

          {/* Accroche */}
          <h1 className="mt-6 text-[clamp(1.75rem,8vw,4rem)] font-bold leading-[1.04] tracking-tight sm:whitespace-nowrap">
            <span className="block">Un salon.</span>
            <span className="block">Quelques personnes.</span>
            <span className="block">
              <span className="underline decoration-[#f7c948] decoration-[6px] underline-offset-[7px] [text-decoration-skip-ink:none]">
                Rien de plus.
              </span>
            </span>
          </h1>

          <p className="mt-6 max-w-[27rem] text-[16px] leading-relaxed text-ink/70 sm:text-[17px]">
            Discutez avec les personnes autour de vous, sans cloud, sans compte et sans configuration compliquée.
          </p>

          {/* Carte de téléchargement */}
          <section
            aria-labelledby="android-title"
            className="mt-10 w-full max-w-[26rem] rounded-2xl border border-ink/10 bg-white/70 p-5 text-left shadow-sm dark:bg-white/[0.04] dark:shadow-none sm:p-6"
          >
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-ink/[0.06]">
                <Smartphone size={22} aria-hidden />
              </span>
              <div className="min-w-0">
                <h2 id="android-title" className="text-[17px] font-bold leading-tight">
                  Îlot pour Android
                </h2>
                <p className="mt-1 font-mono text-[12px] text-ink/70">Android · version {APP_VERSION} · bêta</p>
              </div>
            </div>

            {apkUrl ? (
              <>
                <a
                  href={apkUrl}
                  download
                  rel="noopener"
                  className={`${YELLOW} mt-5 flex h-14 w-full items-center justify-center gap-2.5 rounded-xl text-[15px] font-semibold transition hover:bg-[#fbd466] active:scale-[0.98] active:bg-[#efbd36] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink motion-reduce:transition-none motion-reduce:active:scale-100`}
                >
                  <Download size={18} aria-hidden />
                  Télécharger l&apos;APK
                </a>
                <p className="mt-3 text-center text-[12px] text-ink/70">
                  Android peut vous demander d&apos;autoriser l&apos;installation.
                </p>
              </>
            ) : (
              <>
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  className="mt-5 flex h-14 w-full cursor-not-allowed items-center justify-center gap-2.5 rounded-xl border border-dashed border-ink/20 bg-ink/[0.04] text-[15px] font-semibold text-ink/70"
                >
                  <Clock size={18} aria-hidden />
                  APK bientôt disponible
                </button>
                <p role="status" className="mt-3 text-center text-[12px] text-ink/70">
                  Le bouton s&apos;activera dès la publication de l&apos;application.
                </p>
              </>
            )}
          </section>

          {/* Lien secondaire */}
          <Link
            href={WEB_APP_HREF}
            className="mt-8 rounded-md px-2 py-1 text-[14px] font-semibold text-ink/70 underline decoration-ink/30 underline-offset-4 transition hover:text-ink hover:decoration-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:opacity-70"
          >
            Ouvrir la version web
          </Link>
        </main>
      </div>
    </div>
  );
}

export default DownloadPage;