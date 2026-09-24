import { Section } from "./Section";

const PRINCIPLES = [
  {
    title: "Consent is two consents.",
    body: "The family agreeing to monitor and the parent agreeing to be monitored are different events with different holders. No call happens until she has said yes herself, and she can say stop to the VA at any time.",
  },
  {
    title: "An unchecked day never looks fine.",
    body: "If nobody reached her, the feed says so in words. Never an empty screen, never a green tick.",
  },
  {
    title: "No automated message after a death.",
    body: "Billing stops that day. Every notification and check-in stops immediately, and the family is routed to a person. Build the exit before the entrance.",
  },
  {
    title: "No medical advice from AI.",
    body: "The assistant does not diagnose, prescribe or interpret results. Medical questions get a clear no and a route to a human, and advice stays with licensed providers.",
  },
  {
    title: "Cancel without a phone call.",
    body: "Cancelling completes in the app. No call, no chat, no retention gate.",
  },
];

export function Principles() {
  return (
    <Section
      id="principles"
      eyebrow="What we won't do"
      title="Written down, not left to the happy path."
      lede="The families we serve are having one of the harder years of their lives. These are the lines the product does not cross."
    >
      <ol className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {PRINCIPLES.map((p, i) => (
          <li
            key={p.title}
            className="rounded-2xl border border-line bg-surface p-5"
          >
            <p aria-hidden className="font-serif text-[22px] text-sage">
              {String(i + 1).padStart(2, "0")}
            </p>
            <h3 className="mt-2 text-[17px] font-semibold text-ink">
              {p.title}
            </h3>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">
              {p.body}
            </p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
