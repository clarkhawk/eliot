"use client";
import { Check, Copy, Share2 } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { Sheet } from "./ui/Sheet";
import { buildInvite, buildInviteLink } from "@/lib/store";
import type { Room } from "@/lib/types";

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function ShareSheet({ room, open, onClose }: { room: Room; open: boolean; onClose: () => void }) {
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [link, setLink] = useState("");

  useEffect(() => {
    if (!open) return;
    setLink(buildInviteLink(room, window.location.origin));
    QRCode.toDataURL(JSON.stringify(buildInvite(room)), { margin: 1, width: 520, errorCorrectionLevel: "M" })
      .then(setQr)
      .catch(() => setQr(""));
  }, [open, room]);

  async function doCopy(kind: "code" | "link") {
    if (await copy(kind === "code" ? room.code : link)) {
      setCopied(kind);
      setTimeout(() => setCopied(null), 1600);
    }
  }

  const canShare = typeof navigator !== "undefined" && "share" in navigator;

  return (
    <Sheet open={open} onClose={onClose} title="Partager le salon">
      <p className="-mt-2 mb-4 text-[13px] text-muted">
        Faites scanner ce QR code ou communiquez le code d&apos;accès aux participants.
      </p>
      <div className="mx-auto flex h-56 w-56 items-center justify-center rounded-2xl bg-white p-3 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {qr ? <img src={qr} alt={`QR code du salon ${room.name}`} className="h-full w-full" /> : <span className="text-sm text-neutral-400">…</span>}
      </div>

      <div className="mt-5 flex items-center gap-2">
        <div className="flex-1 rounded-xl border border-line px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">Code d&apos;accès</div>
          <div className="font-mono text-lg font-semibold tracking-wider">{room.code}</div>
        </div>
        <button
          onClick={() => doCopy("code")}
          aria-label="Copier le code"
          className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-ink dark:border dark:border-line"
        >
          {copied === "code" ? <Check size={18} /> : <Copy size={18} />}
        </button>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={() => doCopy("link")}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-line text-[14px] font-semibold"
        >
          {copied === "link" ? <Check size={16} /> : <Copy size={16} />}
          {copied === "link" ? "Lien copié" : "Copier le lien"}
        </button>
        {canShare && (
          <button
            onClick={() => navigator.share({ title: `Îlot — ${room.name}`, url: link }).catch(() => {})}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-line text-[14px] font-semibold"
          >
            <Share2 size={16} /> Partager
          </button>
        )}
      </div>
    </Sheet>
  );
}
