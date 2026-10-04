"use client";
import { useEffect, useRef } from "react";
import { pad2 } from "@/lib/format";

const ITEM = 44;

/** Roue verticale à défilement magnétique (heures / minutes / secondes). */
export function Wheel({
  label,
  max,
  value,
  active,
  onChange,
  onActivate,
}: {
  label: string;
  max: number;
  value: number;
  active: boolean;
  onChange: (v: number) => void;
  onActivate: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el && Math.round(el.scrollTop / ITEM) !== value) el.scrollTop = value * ITEM;
  }, [value]);

  const items = Array.from({ length: max + 1 }, (_, i) => i);

  return (
    <div
      className={`flex-1 border-b-2 pb-2 text-center transition-colors dark:border-b-0 dark:border-l dark:border-line dark:first:border-l-0 ${
        active ? "border-ink" : "border-transparent"
      }`}
    >
      <div
        ref={ref}
        role="spinbutton"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        onPointerDown={onActivate}
        onFocus={onActivate}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp") { e.preventDefault(); onChange(Math.max(0, value - 1)); }
          if (e.key === "ArrowDown") { e.preventDefault(); onChange(Math.min(max, value + 1)); }
        }}
        onScroll={(e) => {
          const i = Math.min(max, Math.max(0, Math.round(e.currentTarget.scrollTop / ITEM)));
          if (i !== value) onChange(i);
        }}
        className="no-scrollbar h-[132px] snap-y snap-mandatory overflow-y-auto outline-none [overscroll-behavior:contain] focus-visible:ring-2 focus-visible:ring-ink/30"
        style={{ paddingBlock: ITEM }}
      >
        {items.map((i) => (
          <button
            key={i}
            type="button"
            tabIndex={-1}
            onClick={() => { onActivate(); onChange(i); }}
            style={{ height: ITEM }}
            className={`block w-full snap-center text-[34px] font-medium tabular-nums leading-none transition-opacity ${
              i === value ? (active ? "text-ink" : "text-muted") : "text-muted opacity-20"
            }`}
          >
            {pad2(i)}
          </button>
        ))}
      </div>
      <div className="mt-1 font-mono text-[12px] text-muted">{label}</div>
    </div>
  );
}
