"use client";

import { RISK_TIERS, tierFor } from "@/lib/risk";

const BAR: Record<string, string> = {
  moss: "bg-moss",
  amber: "bg-amber",
  clay: "bg-clay",
  critical: "bg-clay",
};

const TEXT: Record<string, string> = {
  moss: "text-moss",
  amber: "text-amber",
  clay: "text-clay",
  critical: "text-clay",
};

/**
 * HITL helper. The score comes from scripted keyword rules in risk.ts, not a
 * model, and it sits next to the VA's structured state without replacing it.
 */
export function RiskMeter({ score }: { score: number }) {
  const t = tierFor(score);
  const critical = t.tone === "critical";
  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        critical ? "border-clay bg-clay-soft" : "border-line bg-cream"
      }`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[13px] font-medium text-muted">
          AI risk score{" "}
          <span className="text-[11px] text-faint">(helper, from notes)</span>
        </p>
        <p
          className={`shrink-0 whitespace-nowrap text-[15px] font-semibold ${
            critical
              ? "rounded-full bg-clay px-2.5 py-0.5 text-white"
              : TEXT[t.tone]
          }`}
        >
          {t.label} · {score}
        </p>
      </div>
      <div
        role="meter"
        aria-label="AI risk score"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={score}
        aria-valuetext={`${score}, ${t.label}`}
        className="relative mt-3 flex h-2.5 gap-0.5 overflow-hidden rounded-full"
      >
        {RISK_TIERS.map((r) => (
          <span
            key={r.tier}
            className={`${BAR[r.tone]} ${r.tier === t.tier ? "opacity-100" : "opacity-20"}`}
            style={{ flexGrow: r.max - r.min + 1 }}
          />
        ))}
      </div>
      <div className="relative mt-0.5 h-3">
        <span
          aria-hidden
          className="absolute -translate-x-1/2 text-[10px] leading-none text-ink transition-[left]"
          style={{ left: `${score}%` }}
        >
          ▲
        </span>
      </div>
      <p
        className={`mt-1 text-[13px] leading-snug text-ink ${critical ? "font-medium" : ""}`}
      >
        {t.route}
      </p>
    </div>
  );
}
