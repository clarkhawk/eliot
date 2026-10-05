import type { ReactNode } from "react";
import { AppShell } from "@/components/ui/AppShell";
import { Splash } from "@/components/Splash";

/**
 * Layout du groupe de routes "shell".
 * Applique le cadre AppShell (vue téléphone sur desktop) uniquement
 * aux routes de l'application : /app, /create, /join, /room.
 */
export default function ShellLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      {children}
      <Splash />
    </AppShell>
  );
}
