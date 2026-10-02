"use client";
import { useSyncExternalStore } from "react";

const KEY = "ilot:theme";
const EVT = "ilot:theme-change";

function subscribe(cb: () => void) {
  window.addEventListener(EVT, cb);
  return () => window.removeEventListener(EVT, cb);
}

export function useIsDark(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => document.documentElement.classList.contains("dark"),
    () => false,
  );
}

export function toggleTheme() {
  const next = !document.documentElement.classList.contains("dark");
  document.documentElement.classList.toggle("dark", next);
  try {
    localStorage.setItem(KEY, next ? "dark" : "light");
  } catch {}
  window.dispatchEvent(new Event(EVT));
}

/** Script injecté dans <head> pour éviter le flash de thème + splash déjà vu. */
export const BOOT_SCRIPT = `(function(){try{var t=localStorage.getItem('${KEY}');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}if(t==='dark')document.documentElement.classList.add('dark');if(sessionStorage.getItem('ilot:splash'))document.documentElement.setAttribute('data-splash','seen')}catch(e){}})();`;
