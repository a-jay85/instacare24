import { Section } from "./Section";

const STEPS = [
  {
    n: "01",
    title: "Reach out",
    body: "A VA contacts the parent inside a window her family chose.",
  },
  {
    n: "02",
    title: "Or fail to",
    body: "She does not answer. This branch matters more than the other one.",
    emphasis: true,
  },
  {
    n: "03",
    title: "Log the outcome",
    body: "Reached, not reached, or reached and something is off.",
  },
  {
    n: "04",
    title: "Tell the family",
    body: "A short summary in their feed within thirty minutes.",
  },
  {
    n: "05",
    title: "Escalate if needed",
    body: "A person picks it up, and it never closes itself.",
  },
];

export function Loop() {
  return (
    <Section
      id="loop"
      eyebrow="The loop"
      title="If this runs every day without failing, the company works."
      lede="Everything else in the product exists to make these five steps reliable and cheap to run."
    >
      <ol className="grid grid-cols-1 gap-3 lg:grid-cols-5">
        {STEPS.map((s, i) => (
          <li
            key={s.n}
            className={`relative rounded-2xl border p-5 ${
              s.emphasis
                ? "border-amber/50 bg-amber-soft"
                : "border-line bg-surface"
            }`}
          >
            <p
              className={`font-serif text-[28px] leading-none ${
                s.emphasis ? "text-amber" : "text-sage"
              }`}
            >
              {s.n}
            </p>
            <h3 className="mt-4 text-[17px] font-semibold text-ink">
              {s.title}
            </h3>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">
              {s.body}
            </p>
            {s.emphasis ? (
              <p className="mt-4 text-[14px] font-semibold leading-snug text-ink">
                No answer is a first-class outcome, not an error. Retries run
                out, an escalation opens, and the family hears before they
                notice on their own.
              </p>
            ) : null}
            {i < STEPS.length - 1 ? (
              <span
                aria-hidden
                className="absolute top-1/2 -right-2.5 z-10 hidden h-5 w-5 -translate-y-1/2 place-items-center rounded-full border border-line bg-cream text-[12px] text-muted lg:grid"
              >
                ›
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </Section>
  );
}
