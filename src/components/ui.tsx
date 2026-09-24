"use client";

import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";

export function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled,
  full,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
  full?: boolean;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-[15px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40";
  const styles = {
    primary: "bg-sage text-white hover:bg-sage-dark",
    secondary: "border border-line bg-surface text-ink hover:bg-cream",
    ghost: "text-muted hover:text-ink",
    danger: "border border-clay/30 bg-clay-soft text-clay hover:bg-clay/10",
  }[variant];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${styles} ${full ? "w-full" : ""}`}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  hint,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
  autoFocus,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: "text" | "tel" | "email" | "numeric";
  autoFocus?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        autoFocus={autoFocus}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-line bg-surface px-4 py-3.5 text-[16px] text-ink outline-none placeholder:text-faint focus:border-sage focus:ring-2 focus:ring-sage/20"
      />
      {hint ? (
        <span className="mt-1.5 block text-[13px] text-muted">{hint}</span>
      ) : null}
    </label>
  );
}

export function TextArea({
  label,
  hint,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      <textarea
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full resize-none rounded-xl border border-line bg-surface px-4 py-3.5 text-[16px] leading-relaxed text-ink outline-none placeholder:text-faint focus:border-sage focus:ring-2 focus:ring-sage/20"
      />
      {hint ? (
        <span className="mt-1.5 block text-[13px] text-muted">{hint}</span>
      ) : null}
    </label>
  );
}

export function Select({
  label,
  hint,
  value,
  onChange,
  options,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-xl border border-line bg-surface bg-[length:12px] bg-[right_1rem_center] bg-no-repeat px-4 py-3.5 text-[16px] text-ink outline-none focus:border-sage focus:ring-2 focus:ring-sage/20"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'%3E%3Cpath fill='%236e655c' d='M1 1l5 5 5-5'/%3E%3C/svg%3E\")",
        }}
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      {hint ? (
        <span className="mt-1.5 block text-[13px] text-muted">{hint}</span>
      ) : null}
    </label>
  );
}

export function RadioCard({
  selected,
  onSelect,
  title,
  description,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-2xl border p-4 text-left transition-colors ${
        selected
          ? "border-sage bg-sage-soft"
          : "border-line bg-surface hover:border-sage/40"
      }`}
    >
      <span className="flex items-start gap-3">
        <span
          className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${
            selected ? "border-sage" : "border-line"
          }`}
        >
          {selected ? (
            <span className="h-2.5 w-2.5 rounded-full bg-sage" />
          ) : null}
        </span>
        <span>
          <span className="block text-[15px] font-medium text-ink">
            {title}
          </span>
          {description ? (
            <span className="mt-0.5 block text-[13px] leading-snug text-muted">
              {description}
            </span>
          ) : null}
        </span>
      </span>
    </button>
  );
}

export function Chip({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`rounded-full border px-3.5 py-2 text-[14px] transition-colors ${
        selected
          ? "border-sage bg-sage text-white"
          : "border-line bg-surface text-muted hover:border-sage/40 hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  // A caller's own background or border colour replaces the default one.
  const bg = /(^|\s)bg-/.test(className) ? "" : "bg-surface";
  const edge = /(^|\s)border-(?!\d|[xytblr]-|0\b)/.test(className)
    ? ""
    : "border-line";
  return (
    <div className={`rounded-2xl border ${edge} ${bg} p-5 ${className}`}>
      {children}
    </div>
  );
}

export type Tone = "sage" | "amber" | "clay" | "moss" | "neutral" | "critical";

const TONE_STYLES: Record<Tone, string> = {
  sage: "border-sage/25 bg-sage-soft text-sage-dark",
  amber: "border-amber/25 bg-amber-soft text-amber",
  clay: "border-clay/25 bg-clay-soft text-clay",
  moss: "border-moss/25 bg-moss-soft text-moss",
  neutral: "border-line bg-cream text-muted",
  critical: "border-clay bg-clay text-white",
};

export function Banner({
  tone = "neutral",
  title,
  children,
}: {
  tone?: Tone;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${TONE_STYLES[tone]}`}>
      <p className="text-[15px] font-semibold">{title}</p>
      {children ? (
        <div className="mt-1 text-[14px] leading-relaxed opacity-90">
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function Pill({
  tone = "neutral",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-1 text-[12px] font-medium ${TONE_STYLES[tone]}`}
    >
      {children}
    </span>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-faint">
      {children}
    </h2>
  );
}

export function LockNote({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 flex items-start gap-2 rounded-xl bg-cream px-3 py-2.5 text-[13px] leading-snug text-muted">
      <svg
        viewBox="0 0 16 16"
        aria-hidden
        className="mt-0.5 h-3.5 w-3.5 shrink-0 fill-faint"
      >
        <path d="M4.5 7V5a3.5 3.5 0 1 1 7 0v2H12a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h.5Zm1.5 0h4V5a2 2 0 1 0-4 0v2Z" />
      </svg>
      <span>{children}</span>
    </p>
  );
}

/** Page heading used at the top of every tab. Serif title, muted one-liner. */
export function PageTitle({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
}) {
  return (
    <div className="mt-3 mb-6">
      {eyebrow ? (
        <p className="text-[13px] font-medium text-faint">{eyebrow}</p>
      ) : null}
      <h1 className="mt-1 font-serif text-[28px] leading-tight text-ink">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mt-1 inline-flex items-center gap-1 text-[14px] font-medium text-sage-dark"
    >
      <span aria-hidden>‹</span> {label}
    </Link>
  );
}

/**
 * Bottom sheet on phones, centred dialog on wider screens. Inside PhoneFrame it
 * stays inside the device because the frame is the fixed-position container.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });
  // Escape closes from anywhere, not only while focus is inside the sheet.
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    panel.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeRef.current();
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      // Hand focus back to whatever opened the sheet, if it is still there.
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [open]);

  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="sheet-backdrop fixed inset-0 z-50 flex items-end justify-center bg-ink/40"
      onClick={onClose}
    >
      <div
        ref={panel}
        tabIndex={-1}
        className="sheet-panel max-h-[88%] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-surface p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="mx-auto mb-4 h-1 w-10 rounded-full bg-line"
          aria-hidden
        />
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-serif text-2xl text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 -mt-1 grid h-11 w-11 shrink-0 place-items-center rounded-full text-faint transition-colors hover:bg-cream hover:text-ink focus-visible:outline-2 focus-visible:outline-sage"
          >
            <svg viewBox="0 0 20 20" aria-hidden className="h-4 w-4">
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}

/** Where a piece of information came from. Every AI-derived fact carries one. */
export function Provenance({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 flex items-center gap-1.5 text-[12px] text-faint">
      <svg viewBox="0 0 16 16" aria-hidden className="h-3 w-3 fill-current">
        <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Zm2.9 5.1-3.4 3.6a.7.7 0 0 1-1 0L5 8.6a.7.7 0 1 1 1-1l1 1 2.9-3a.7.7 0 1 1 1 1Z" />
      </svg>
      <span>{children}</span>
    </p>
  );
}

export function money(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n % 1 ? 2 : 0,
  });
}
