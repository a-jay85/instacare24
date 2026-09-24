import { Section } from "./Section";

/** Verbatim from the v1 scope metrics table. */
const METRICS = [
  {
    target: "≥ 92% weekly",
    metric: "Check-ins completed inside window",
    why: "The check-in is the product. Below this, families are paying for an intention.",
  },
  {
    target: "100%",
    metric: "No-answer events resolved to a known state within 2 hours",
    why: "The only number here that cannot be a percentage below one hundred.",
  },
  {
    target: "≤ 15 min",
    metric: "Escalation acknowledgement, p90, staffed hours",
    why: "What the family thinks they are buying.",
  },
  {
    target: "≥ 4",
    metric: "Feed opens per family per week, month 1",
    why: "Earliest reliable churn predictor in consumer health.",
  },
  {
    target: "≥ 85%",
    metric: "Day-30 retention",
    why: "Catches a bad onboarding before it costs a year of CAC.",
  },
  {
    target: "≥ 50%",
    stretch: "stretch 70%",
    metric: "Annual retention",
    why: "From the proposal. The make-or-break number in the model.",
  },
];

export function Metrics() {
  return (
    <Section
      id="metrics"
      eyebrow="Accountability"
      title="The numbers we will be held to."
      lede="Every one carries a target. These are commitments for v1, not results. There is no traction on this page yet, on purpose."
      tinted
    >
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {METRICS.map((m) => (
          <li
            key={m.metric}
            className="flex flex-col rounded-2xl border border-line bg-cream p-5"
          >
            <p className="font-serif text-[36px] leading-none text-sage-dark">
              {m.target}
              {m.stretch ? (
                <span className="ml-2 font-sans text-[14px] text-muted">
                  {m.stretch}
                </span>
              ) : null}
            </p>
            <h3 className="mt-3 text-[15px] font-semibold text-ink">
              {m.metric}
            </h3>
            <p className="mt-2 text-[14px] leading-relaxed text-muted">
              {m.why}
            </p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
