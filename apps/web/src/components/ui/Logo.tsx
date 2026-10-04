import { LOGO_PATH, LOGO_VIEWBOX } from "@/lib/logo-path";

export function Logo({ className = "h-16 w-16" }: { className?: string }) {
  return (
    <svg viewBox={LOGO_VIEWBOX} className={className} fill="currentColor" role="img" aria-label="Îlot">
      <path fillRule="evenodd" d={LOGO_PATH} />
    </svg>
  );
}

/** Trois hexagones « fantômes » utilisés comme placeholder du scanner. */
export function HexCluster({ className = "h-14 w-14" }: { className?: string }) {
  const hex = "M12 2 L21 7 V17 L12 22 L3 17 V7 Z";
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
      <g transform="translate(20 2) scale(1.1)"><path d={hex} /></g>
      <g transform="translate(4 28) scale(1.1)"><path d={hex} /></g>
      <g transform="translate(34 28) scale(1.1)"><path d={hex} /></g>
    </svg>
  );
}
