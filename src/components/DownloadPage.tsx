import Link from "next/link";
import { Download, Smartphone } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export function DownloadPage() {
  const androidUrl = process.env.NEXT_PUBLIC_ANDROID_APK_URL;

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-5 pb-8 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <header className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-[18px] font-bold" aria-label="Îlot accueil">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-[17px] font-bold text-white">
            Î
          </span>
          Îlot
        </Link>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">messagerie locale</span>
      </header>

      <main className="flex flex-1 flex-col justify-center py-12">
        <div className="mb-7 flex h-16 w-16 items-center justify-center rounded-2xl bg-ink/5">
          <Logo className="h-10 w-10 text-ink" />
        </div>
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">sans compte · sans internet</p>
        <h1 className="mt-4 max-w-[360px] text-[clamp(2.75rem,12vw,4.5rem)] font-bold leading-[0.94] tracking-tight">
          Un salon.<br />Quelques personnes.<br />Rien de plus.
        </h1>
        <p className="mt-6 max-w-[390px] text-[17px] leading-relaxed text-muted">
          Îlot crée un espace temporaire pour discuter à proximité, simplement et sans dépendre du cloud.
        </p>

        <section className="mt-10 rounded-3xl border border-line bg-page px-5 py-5 shadow-sm" aria-labelledby="download-title">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-ink">
              <Smartphone size={20} />
            </div>
            <div>
              <h2 id="download-title" className="text-[17px] font-bold">Télécharger l&apos;application</h2>
              <p className="mt-1 text-[13px] leading-snug text-muted">
                Installez Îlot sur Android pour préparer vos salons locaux depuis votre téléphone.
              </p>
            </div>
          </div>
          {androidUrl ? (
            <a
              href={androidUrl}
              download
              className="mt-5 flex h-12 items-center justify-between rounded-xl bg-primary px-4 text-[14px] font-semibold text-primary-ink transition active:scale-[0.98]"
            >
              Télécharger l&apos;APK Android
              <Download size={18} />
            </a>
          ) : (
            <p className="mt-5 rounded-xl bg-ink/5 px-4 py-3 font-mono text-[11px] text-muted">APK bientôt disponible</p>
          )}
          <p className="mt-3 text-center font-mono text-[10px] text-muted">Android · version 1.0.0</p>
        </section>
      </main>

      <Link href="/app" className="text-center text-[13px] font-semibold text-muted underline underline-offset-4">
        Ouvrir la version web
      </Link>
    </div>
  );
}
