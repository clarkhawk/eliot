"use client";
import { ArrowUp, ChevronLeft, MoreHorizontal } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { PseudoSheet } from "@/components/PseudoSheet";
import { IconButton } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { formatRemaining, formatTime } from "@/lib/format";
import { useHydrated, useNow } from "@/lib/hooks";
import { addMessage, deleteRoom, getClientId, useMessages, usePseudo, useRoom } from "@/lib/store";

export function RoomScreen() {
  const params = useParams<{ code: string }>();
  const code = decodeURIComponent(params.code).toUpperCase();
  const router = useRouter();
  const hydrated = useHydrated();
  const room = useRoom(code);
  const messages = useMessages(code);
  const { pseudo, lastPseudo } = usePseudo();
  const now = useNow(15_000);

  const [text, setText] = useState("");
  const [menu, setMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const clientId = useMemo(() => (hydrated ? getClientId() : ""), [hydrated]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  if (!hydrated) return <div className="flex-1 bg-page" />;

  if (!room) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-page px-8 text-center">
        <p className="text-lg font-bold">Salon introuvable</p>
        <p className="text-[14px] text-muted">Il a été supprimé de cet appareil ou n&apos;a jamais été rejoint.</p>
        <button onClick={() => router.push("/app")} className="rounded-xl bg-primary px-5 py-3 text-[14px] font-semibold text-primary-ink">
          Retour à l&apos;accueil
        </button>
      </div>
    );
  }

  const expired = now > 0 && room.expiresAt <= now;
  const status = now === 0 ? "…" : expired ? "salon expiré · lecture seule" : formatRemaining(room.expiresAt - now);

  function send() {
    const t = text.trim();
    if (!t || !pseudo || expired) return;
    try {
      addMessage({ roomCode: code, authorId: clientId, author: pseudo, text: t });
      setText("");
      setStorageError("");
    } catch (cause) {
      setStorageError(cause instanceof Error ? cause.message : "Impossible d'enregistrer le message sur cet appareil.");
    }
  }

  return (
    <div className="relative flex flex-1 flex-col bg-page">
      <header className="flex items-center gap-3 border-b border-line px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
        <IconButton label="Retour" onClick={() => router.push("/app")}>
          <ChevronLeft size={20} />
        </IconButton>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[17px] font-bold leading-tight">{room.name}</h1>
          <p className="mt-0.5 flex items-center gap-1.5 font-mono text-[11px] text-muted">
            <span className={`h-1.5 w-1.5 rounded-full ${expired ? "bg-muted" : "bg-accent"}`} />
            {status}
          </p>
        </div>
        <IconButton label="Options du salon" onClick={() => setMenu((v) => !v)} aria-expanded={menu}>
          <MoreHorizontal size={20} />
        </IconButton>

        {menu && (
          <>
            <button aria-label="Fermer le menu" className="fixed inset-0 z-10 cursor-default" onClick={() => setMenu(false)} />
            <div className="absolute right-4 top-[68px] z-20 w-56 overflow-hidden rounded-2xl border border-line bg-page text-[14px] shadow-xl [animation:ilot-pop_.15s_ease-out]">
              <button
                className="block w-full px-4 py-3 text-left hover:bg-ink/5"
                onClick={async () => {
                  try {
                    await navigator.clipboard?.writeText(room.code);
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 1600);
                  } catch {}
                  setMenu(false);
                }}
              >
                {copied ? "Code copié" : `Copier le code (${room.code})`}
              </button>
              <button
                className="block w-full px-4 py-3 text-left text-danger hover:bg-ink/5"
                onClick={() => {
                  setMenu(false);
                  setConfirmDelete(true);
                }}
              >
                Supprimer le salon
              </button>
            </div>
          </>
        )}
      </header>

      <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-4 py-4" aria-live="polite">
        {storageError && <p role="alert" className="text-center text-[13px] text-danger">{storageError}</p>}
        {messages.length === 0 && (
          <p className="m-auto max-w-[240px] text-center text-[13px] text-muted">
            Aucun message pour l&apos;instant. Lancez la discussion !
          </p>
        )}
        {messages.map((m, i) => {
          const mine = m.authorId === clientId;
          const prev = messages[i - 1];
          const showLabel = !prev || prev.authorId !== m.authorId || m.ts - prev.ts > 5 * 60_000;
          return (
            <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"} ${showLabel && i > 0 ? "mt-3" : ""}`}>
              {showLabel && (
                <span className="mb-1 flex items-center gap-1 font-mono text-[11px] text-muted">
                  <span className={`h-1.5 w-1.5 rounded-full ${mine ? "bg-accent" : "bg-muted"}`} />
                  {mine ? "Moi" : m.author}
                </span>
              )}
              <div
                title={formatTime(m.ts)}
                aria-label={`${mine ? "Moi" : m.author}, ${formatTime(m.ts)} : ${m.text}`}
                className={`max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-[15px] leading-snug ${
                  mine
                    ? "bg-bubble-out text-bubble-out-ink"
                    : "bg-bubble-in text-bubble-in-ink shadow-[0_0_0_1px_var(--line)] dark:shadow-none"
                }`}
              >
                {m.text}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(); }}
        className="flex items-center gap-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={expired}
          placeholder={expired ? "Ce salon a expiré" : "Votre message…"}
          aria-label="Votre message"
          maxLength={2000}
          autoComplete="off"
          className="h-12 min-w-0 flex-1 rounded-full bg-composer px-5 text-[15px] text-composer-ink outline-none placeholder:text-composer-muted disabled:opacity-60"
        />
        <button
          type="submit"
          aria-label="Envoyer"
          disabled={expired || !text.trim()}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-ink transition active:scale-95 disabled:opacity-50 dark:border dark:border-line"
        >
          <ArrowUp size={20} />
        </button>
      </form>

      <PseudoSheet open={!pseudo} initial={lastPseudo ?? ""} />
      <Sheet open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Supprimer le salon">
        <p className="-mt-2 text-[13px] text-muted">
          Le salon et son historique seront supprimés de cet appareil uniquement.
        </p>
        <div className="mt-5 flex gap-2">
          <button
            className="h-12 flex-1 rounded-xl border border-line text-[14px] font-semibold"
            onClick={() => setConfirmDelete(false)}
          >
            Annuler
          </button>
          <button
            className="h-12 flex-1 rounded-xl bg-danger text-[14px] font-semibold text-white"
            onClick={() => { deleteRoom(code); router.push("/app"); }}
          >
            Supprimer
          </button>
        </div>
      </Sheet>
    </div>
  );
}
