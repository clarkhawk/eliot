"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { HexCluster } from "./ui/Logo";

type Props = { onResult: (text: string) => void; onError: (msg: string) => void };

/** Cadre de scan QR : caméra arrière via getUserMedia + BarcodeDetector (repli jsQR). */
export function Scanner({ onResult, onError }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const startingRef = useRef(false);
  const [state, setState] = useState<"idle" | "starting" | "on">("idle");

  const stop = useCallback(() => {
    startingRef.current = false;
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setState("idle");
  }, []);

  useEffect(() => stop, [stop]);

  async function start() {
    if (state !== "idle" || startingRef.current) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      return onError("Caméra indisponible (HTTPS requis). Saisissez le code d'accès.");
    }
    startingRef.current = true;
    setState("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (!videoRef.current || !startingRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      const video = videoRef.current;
      video.srcObject = stream;
      await video.play();
      setState("on");

      const BD = (window as any).BarcodeDetector;
      const detector = BD ? new BD({ formats: ["qr_code"] }) : null;
      const jsQR = detector ? null : (await import("jsqr")).default;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      let last = 0;

      const tick = async (t: number) => {
        if (!streamRef.current) return;
        if (t - last > 120 && video.readyState >= 2) {
          last = t;
          try {
            let text: string | undefined;
            if (detector) {
              const codes = await detector.detect(video);
              text = codes[0]?.rawValue;
            } else if (jsQR) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              ctx.drawImage(video, 0, 0);
              const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
              text = jsQR(img.data, img.width, img.height)?.data;
            }
            if (text) {
              stop();
              onResult(text);
              return;
            }
          } catch {
            /* frame illisible : on réessaie */
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      stop();
      onError("Accès à la caméra refusé. Saisissez le code d'accès.");
    }
  }

  return (
    <button
      type="button"
      onClick={state === "on" ? stop : start}
      disabled={state === "starting"}
      aria-label={state === "on" ? "Arrêter le scan" : "Activer la caméra pour scanner un QR code"}
      className="relative aspect-[1.25] w-full overflow-hidden rounded-3xl bg-ink/[0.04] dark:bg-white/[0.06]"
    >
      <video
        ref={videoRef}
        playsInline
        muted
        className={`absolute inset-0 h-full w-full object-cover ${state === "on" ? "opacity-100" : "opacity-0"}`}
      />
      {state !== "on" && (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted/60">
          <HexCluster className="h-16 w-16" />
          <span className="text-[12px] text-muted">
            {state === "starting" ? "Ouverture de la caméra…" : "Touchez pour scanner"}
          </span>
        </span>
      )}
      {(["tl", "tr", "bl", "br"] as const).map((c) => (
        <span
          key={c}
          className={`pointer-events-none absolute h-7 w-7 border-ink/70 ${
            c === "tl" ? "left-3 top-3 rounded-tl-xl border-l-2 border-t-2" : ""
          } ${c === "tr" ? "right-3 top-3 rounded-tr-xl border-r-2 border-t-2" : ""} ${
            c === "bl" ? "bottom-3 left-3 rounded-bl-xl border-b-2 border-l-2" : ""
          } ${c === "br" ? "bottom-3 right-3 rounded-br-xl border-b-2 border-r-2" : ""} ${
            state === "on" ? "border-white" : ""
          }`}
        />
      ))}
    </button>
  );
}
