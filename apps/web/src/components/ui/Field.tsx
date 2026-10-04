import type { InputHTMLAttributes, ReactNode } from "react";

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-muted">
      {children}
    </label>
  );
}

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`h-12 w-full rounded-xl border border-line bg-field px-4 text-[15px] text-field-ink outline-none placeholder:text-field-muted focus:border-ink ${className}`}
      {...props}
    />
  );
}
