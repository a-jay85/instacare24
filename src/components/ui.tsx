"use client";

import type { ReactNode } from "react";

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
      {hint ? <span className="mt-1.5 block text-[13px] text-muted">{hint}</span> : null}
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
      {hint ? <span className="mt-1.5 block text-[13px] text-muted">{hint}</span> : null}
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
      {hint ? <span className="mt-1.5 block text-[13px] text-muted">{hint}</span> : null}
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
          {selected ? <span className="h-2.5 w-2.5 rounded-full bg-sage" /> : null}
        </span>
        <span>
          <span className="block text-[15px] font-medium text-ink">{title}</span>
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
  return (
    <div className={`rounded-2xl border border-line bg-surface p-5 ${className}`}>
      {children}
    </div>
  );
}

type Tone = "sage" | "amber" | "clay" | "moss" | "neutral";

const TONE_STYLES: Record<Tone, string> = {
  sage: "border-sage/25 bg-sage-soft text-sage-dark",
  amber: "border-amber/25 bg-amber-soft text-amber",
  clay: "border-clay/25 bg-clay-soft text-clay",
  moss: "border-moss/25 bg-moss-soft text-moss",
  neutral: "border-line bg-cream text-muted",
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
        <div className="mt-1 text-[14px] leading-relaxed opacity-90">{children}</div>
      ) : null}
    </div>
  );
}

export function Pill({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
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
