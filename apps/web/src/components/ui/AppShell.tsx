import type { ReactNode } from "react";

/** Cadre mobile : plein écran sur téléphone, « device » centré sur desktop. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex h-dvh w-full max-w-[430px] items-stretch md:items-center md:py-6">
      <div className="relative flex h-full w-full flex-col overflow-hidden bg-bg text-ink md:h-[min(880px,100%)] md:rounded-[2.5rem] md:border md:border-white/10 md:shadow-2xl">
        {children}
      </div>
    </div>
  );
}
