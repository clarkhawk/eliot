"use client";
import { useEffect, useState } from "react";
import { Logo } from "./ui/Logo";

/** Écran de chargement affiché une fois par session. */
export function Splash() {
  const [phase, setPhase] = useState<"show" | "fade" | "gone">("show");

  useEffect(() => {
    try {
      if (sessionStorage.getItem("ilot:splash")) {
        setPhase("gone");
        return;
      }
    } catch {}
    const t1 = setTimeout(() => setPhase("fade"), 1800);
    const t2 = setTimeout(() => {
      setPhase("gone");
      try { sessionStorage.setItem("ilot:splash", "1"); } catch {}
    }, 2100);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      className={`splash absolute inset-0 z-50 flex flex-col items-center bg-bg px-8 transition-opacity duration-300 ${
        phase === "fade" ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="relative">
          <h1 className="text-[88px] font-black leading-none tracking-tighter text-ink">ÎLOT</h1>
          <span className="absolute -bottom-5 right-0 text-[12px] font-semibold text-ink">made by Waddle</span>
        </div>
        <div className="bg-grid mt-14 flex h-[200px] w-[230px] items-center justify-center">
          <Logo className="h-[130px] w-[130px] text-ink" />
        </div>
      </div>
      <div className="w-full max-w-[220px] pb-16 text-center">
        <div className="h-2 w-full overflow-hidden rounded-full border border-ink/30 bg-ink/10">
          <div className="h-full rounded-full bg-ink [animation:ilot-progress_1.7s_ease-in-out_forwards]" />
        </div>
        <p className="mt-1 text-[13px] text-muted">Chargement…</p>
      </div>
    </div>
  );
}
