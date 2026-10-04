"use client";
import { Moon, Sun } from "lucide-react";
import { toggleTheme, useIsDark } from "@/lib/theme";

export function ThemeToggle() {
  const dark = useIsDark();
  return (
    <button
      onClick={toggleTheme}
      aria-label={dark ? "Passer au thème clair" : "Passer au thème sombre"}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-tile text-tile-ink transition active:scale-95 dark:bg-chip dark:text-chip-ink"
    >
      {dark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
