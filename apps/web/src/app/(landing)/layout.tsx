import type { ReactNode } from "react";

/**
 * Layout racine de la page d'accueil (landing).
 * Bypasse volontairement l'AppShell pour que la landing
 * occupe tout l'écran sans être enfermée dans le cadre mobile.
 */
export default function LandingLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
