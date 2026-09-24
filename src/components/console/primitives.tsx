"use client";

import type { ReactNode } from "react";
import { Pill } from "@/components/ui";
import { RISK_TIERS, tierFor } from "@/lib/risk";
import type { RiskTier } from "@/lib/types";

export const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage";

/** Card with a small uppercase heading. The console's basic block. */
export function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-line bg-surface p-5 ${className}`}
    >
      {title || action ? (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title ? (
            <h3 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-faint">
              {title}
            </h3>
          ) : (
            <span />
          )}
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/** ui.tsx Button without aria/className hooks; the console needs both. */
export function CButton({
  children,
  onClick,
  variant = "primary",
  disabled,
  size = "md",
  className = "",
  ...aria
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
  size?: "sm" | "md";
  className?: string;
  "aria-pressed"?: boolean;
  "aria-expanded"?: boolean;
  "aria-label"?: string;
  "aria-describedby"?: string;
}) {
  const styles = {
    primary: "bg-sage text-white hover:bg-sage-dark",
    secondary: "border border-line bg-surface text-ink hover:bg-cream",
    ghost: "text-muted hover:text-ink hover:bg-cream",
    danger: "border border-clay/30 bg-clay-soft text-clay hover:bg-clay/10",
  }[variant];
  const pad = size === "sm" ? "px-3 py-2 text-[13px]" : "px-4 py-3 text-[15px]";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      {...aria}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${pad} ${styles} ${FOCUS} ${className}`}
    >
      {children}
    </button>
  );
}

export function TierPill({ tier, score }: { tier?: RiskTier; score?: number }) {
  const t =
    score !== undefined
      ? tierFor(score)
      : RISK_TIERS.find((r) => r.tier === tier);
  if (!t) return <Pill>No score</Pill>;
  return (
    <Pill tone={t.tone}>
      {t.label}
      {score !== undefined ? ` · ${score}` : ""}
    </Pill>
  );
}

export function ConsoleHeader({
  title,
  subtitle,
  aside,
}: {
  title: string;
  subtitle?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-serif text-[30px] leading-tight text-ink">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-[15px] text-muted">{subtitle}</p>
        ) : null}
      </div>
      {aside}
    </header>
  );
}
