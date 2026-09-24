import { RISK_TIERS } from "@/lib/risk";
import { Kicker, Section } from "./Section";

const LAYERS = [
  {
    who: "AI engine",
    does: "Reads the call notes, suggests a risk score, drafts the family summary, sends reminders.",
    cost: "Runs on every call, no staff time",
  },
  {
    who: "Offshore VA",
    does: "Makes the daily call, logs one of three states, takes notes on medium-risk days.",
    cost: "Offshore cost, every day",
  },
  {
    who: "US Care Specialist",
    does: "Owns escalations, consent calls, hard conversations and post-discharge weeks.",
    cost: "US cost, only when it matters",
  },
  {
    who: "Clinical reviewer",
    does: "RN or LCSW on call. Read-only view. Advice stays with licensed providers.",
    cost: "Rarely needed",
  },
];

/** Literal class strings so Tailwind can see them. */
const BAND: Record<(typeof RISK_TIERS)[number]["tone"], string> = {
  moss: "border-moss/30 bg-moss-soft text-moss",
  amber: "border-amber/40 bg-amber-soft text-ink",
  clay: "border-clay/30 bg-clay-soft text-clay",
  critical: "border-clay bg-clay text-white",
};

export function HumanLoop() {
  return (
    <Section
      id="hitl"
      eyebrow="Human in the loop"
      title="AI does the reading and routing. People do the caring."
      lede="Costs stay at offshore levels on ordinary days and move up to US clinicians only when a day stops being ordinary."
    >
      <ol className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        {LAYERS.map((l, i) => (
          <li
            key={l.who}
            className="rounded-2xl border border-line bg-surface p-5"
          >
            <Kicker>Layer {i + 1}</Kicker>
            <h3 className="mt-2 text-[17px] font-semibold text-ink">{l.who}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">
              {l.does}
            </p>
            <p className="mt-4 text-[13px] font-medium text-sage-dark">
              {l.cost}
            </p>
          </li>
        ))}
      </ol>

      <h3 className="mt-12 text-[15px] font-semibold text-ink">
        Risk tiers, scored 0 to 100
      </h3>
      <p className="mt-1 max-w-2xl text-[14px] leading-relaxed text-muted">
        The score is a helper next to the VA&apos;s log, never a replacement for
        it. &ldquo;Something is off&rdquo; always opens an escalation, whatever
        the number says.
      </p>
      <ol
        aria-label="Risk tiers from 0 to 100 and where each one routes"
        className="mt-4 flex flex-col gap-2 lg:flex-row lg:gap-1"
      >
        {RISK_TIERS.map((t) => (
          <li
            key={t.tier}
            style={{ flexGrow: t.max - t.min + 1, flexBasis: 0 }}
            className={`rounded-xl border p-4 lg:min-w-[190px] ${BAND[t.tone]}`}
          >
            <p className="text-[14px] font-semibold">
              {t.label} · {t.min}–{t.max}
            </p>
            <p
              className={`mt-1.5 text-[14px] leading-snug ${
                t.tone === "critical" ? "text-white" : "text-ink"
              }`}
            >
              {t.route}
            </p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
