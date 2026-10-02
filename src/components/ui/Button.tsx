import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "tile";

const base =
  "inline-flex items-center justify-center font-semibold transition active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

const variants: Record<Variant, string> = {
  primary:
    "h-14 w-full rounded-2xl bg-primary text-primary-ink text-[15px] dark:border dark:border-line",
  tile: "min-h-[112px] flex-1 rounded-2xl bg-tile px-3 text-center text-[15px] text-tile-ink",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function IconButton({
  className = "",
  label,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-chip text-chip-ink shadow-sm transition active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${className}`}
      {...props}
    />
  );
}
