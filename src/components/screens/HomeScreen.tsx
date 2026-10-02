"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { formatRemaining } from "@/lib/format";
import { useNow } from "@/lib/hooks";
import { useRooms } from "@/lib/store";

export function HomeScreen() {
  const router = useRouter();
  const rooms = useRooms();
  const now = useNow();
  const androidUrl = process.env.NEXT_PUBLIC_ANDROID_APK_URL;

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-5 pb-8 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <div className="flex items-start justify-between">
        <div className="bg-grid flex h-32 w-36 items-center justify-center rounded-sm bg-ink/5">
          <Logo className="h-[60px] w-[60px] text-ink" />
        </div>
        <ThemeToggle />
      </div>

      <h1 className="mt-12 text-4xl font-bold tracking-tight">Bienvenue</h1>
      <p className="mt-2 text-[14px] text-muted">Configurez un espace temporaire pour échanger</p>

      <div className="mt-12 flex gap-3">
        <Button variant="tile" onClick={() => router.push("/create")}>
          Créer le salon
        </Button>
        <Button variant="tile" onClick={() => router.push("/join")}>
          Rejoindre un salon
        </Button>
      </div>

      <section className="mt-8 rounded-2xl border border-line bg-page px-4 py-4 shadow-sm" aria-labelledby="download-title">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-[18px] font-bold text-ink">
            ↓
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="download-title" className="text-[15px] font-bold">Emportez Îlot avec vous</h2>
            <p className="mt-1 text-[13px] leading-snug text-muted">
              Installez l&apos;application Android pour préparer les salons locaux depuis votre téléphone.
            </p>
            {androidUrl ? (
              <a
                href={androidUrl}
                download
                className="mt-3 inline-flex h-10 items-center rounded-xl bg-primary px-4 text-[13px] font-semibold text-primary-ink transition active:scale-[0.98]"
              >
                Télécharger l&apos;APK Android
              </a>
            ) : (
              <p className="mt-3 font-mono text-[11px] text-muted">APK bientôt disponible</p>
            )}
          </div>
        </div>
      </section>

      {rooms.length > 0 && (
        <section className="mt-10" aria-label="Salons récents">
          <h2 className="mb-3 font-mono text-[12px] uppercase tracking-wide text-muted">Salons récents</h2>
          <ul className="space-y-2">
            {rooms.slice(0, 6).map((r) => {
              const left = now ? r.expiresAt - now : 1;
              const expired = now ? left <= 0 : false;
              return (
                <li key={r.code}>
                  <Link
                    href={`/room/${r.code}`}
                    className="flex items-center gap-3 rounded-2xl border border-line px-4 py-3 transition active:scale-[0.99]"
                  >
                    <span className={`h-2 w-2 shrink-0 rounded-full ${expired ? "bg-muted" : "bg-accent"}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold">{r.name}</span>
                      <span className="block font-mono text-[11px] text-muted">
                        {r.code} · {now ? (expired ? "expiré" : formatRemaining(left)) : "…"}
                      </span>
                    </span>
                    <ChevronRight size={18} className="text-muted" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
