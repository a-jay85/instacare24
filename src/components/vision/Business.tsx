import { Pill } from "@/components/ui";
import { PRICE_MONTHLY } from "@/lib/config";
import { Kicker, Section } from "./Section";

const ROADMAP = [
  {
    name: "Essentials",
    price: 39,
    body: "Medication reminders, visit summaries, basic alerts",
  },
  {
    name: "Active Care",
    price: 99,
    body: "Adds Family AI Assistant, insurance & EOB support, HITL escalation",
  },
  {
    name: "Family Plus",
    price: 199,
    body: "Everything in Active Care, plus multi-member family access",
  },
];

const V1_INCLUDES = [
  "A daily call inside a window the family chose",
  "An honest summary in the feed within 30 minutes",
  "Escalation to a named person, with no silent close",
  "Medication reminders on the same channel",
  "Cancel in the app, no phone call",
];

export function Business() {
  return (
    <Section
      id="model"
      eyebrow="Business model"
      title="One price at launch. Tiers once the loop is proven."
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="rounded-2xl border border-sage/30 bg-sage-soft p-6 lg:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <Kicker>Version 1</Kicker>
            <Pill tone="sage">In scope</Pill>
          </div>
          <p className="mt-4 font-serif text-[52px] leading-none text-ink">
            ${PRICE_MONTHLY}
            <span className="ml-1 font-sans text-[16px] text-muted">
              /month
            </span>
          </p>
          <p className="mt-2 text-[15px] text-muted">One tier, card on file.</p>
          <ul className="mt-5 space-y-2.5 text-[15px] text-ink">
            {V1_INCLUDES.map((line) => (
              <li key={line} className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sage"
                />
                <span className="leading-relaxed">{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-dashed border-line p-6 lg:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Kicker>Pricing roadmap</Kicker>
            <span className="inline-block rounded-full border border-amber/40 bg-amber-soft px-2.5 py-1 text-[12px] font-semibold text-ink">
              Roadmap, not in v1
            </span>
          </div>
          <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {ROADMAP.map((t) => (
              <li
                key={t.name}
                className="rounded-xl border border-line bg-surface p-4"
              >
                <h3 className="text-[15px] font-semibold text-ink">{t.name}</h3>
                <p className="mt-1 font-serif text-[26px] text-ink">
                  ${t.price}
                  <span className="ml-0.5 font-sans text-[13px] text-muted">
                    /mo
                  </span>
                </p>
                <p className="mt-2 text-[14px] leading-snug text-muted">
                  {t.body}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[14px] leading-relaxed text-muted">
            <span className="font-semibold text-ink">Concierge.</span> A US Care
            Specialist as the family&apos;s regular contact, for post-discharge
            weeks and harder situations. Priced later.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-surface p-6">
        <h3 className="text-[17px] font-semibold text-ink">
          Where the margin lives
        </h3>
        <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <p className="font-serif text-[28px] text-ink">&lt; 60 seconds</p>
            <p className="mt-1 text-[15px] leading-relaxed text-muted">
              Median time for a VA to log a call. Above that, cost to serve
              breaks the margin. The staff console is built around this number.
            </p>
          </div>
          <div>
            <p className="font-serif text-[28px] text-ink">≥ 92%</p>
            <p className="mt-1 text-[15px] leading-relaxed text-muted">
              Check-ins completed inside the family&apos;s window, weekly. Below
              this, families are paying for an intention, and they stop.
            </p>
          </div>
        </div>
        <p className="mt-5 text-[14px] leading-relaxed text-muted">
          Ordinary days run on the AI engine and an offshore VA. US specialists
          and clinicians are spent only on escalations, which is what keeps a
          daily human call viable at ${PRICE_MONTHLY}.
        </p>
      </div>
    </Section>
  );
}
