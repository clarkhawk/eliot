"use client";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { IconButton } from "./Button";

export function ScreenHeader({ title, subtitle, backHref }: { title: string; subtitle: string; backHref?: string }) {
  const router = useRouter();
  return (
    <header className="flex items-start gap-3 px-5 pb-4 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <IconButton label="Retour" onClick={() => (backHref ? router.push(backHref) : router.back())}>
        <ChevronLeft size={20} />
      </IconButton>
      <div className="min-w-0 pt-0.5">
        <h1 className="text-[22px] font-bold leading-tight">{title}</h1>
        <p className="mt-1 text-[13px] leading-snug text-muted">{subtitle}</p>
      </div>
    </header>
  );
}
