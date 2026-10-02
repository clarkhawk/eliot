"use client";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

/** Feuille modale ancrée dans le cadre de l'app (le shell est `relative`). */
export function Sheet({
  open,
  onClose,
  title,
  children,
  dismissible = true,
}: {
  open: boolean;
  onClose?: () => void;
  title: string;
  children: ReactNode;
  dismissible?: boolean;
}) {
  useEffect(() => {
    if (!open || !dismissible) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, dismissible, onClose]);

  if (!open) return null;
  return (
    <div className="absolute inset-0 z-40 flex items-end" role="dialog" aria-modal="true" aria-label={title}>
      <button
        aria-label="Fermer"
        className="absolute inset-0 bg-black/50 [animation:ilot-fade_.2s_ease-out]"
        onClick={dismissible ? onClose : undefined}
        tabIndex={-1}
      />
      <div className="relative w-full rounded-t-3xl bg-page px-6 pb-8 pt-5 text-ink shadow-2xl [animation:ilot-sheet_.25s_ease-out]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          {dismissible && (
            <button aria-label="Fermer" onClick={onClose} className="rounded-full p-1.5 text-muted hover:text-ink">
              <X size={20} />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
