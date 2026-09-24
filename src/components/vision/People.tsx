import { Kicker, Section } from "./Section";

type Persona = { role: string; name: string; body: string };

const FAMILY: Persona[] = [
  {
    role: "Buyer · pays",
    name: "The adult child",
    body: "Mid-forties to sixty, working, often out of state. Buying the end of a low background hum of worry. Churns the month she stops feeling informed, not the month the service gets worse.",
  },
  {
    role: "Subject · daily user",
    name: "The parent",
    body: "Mid-seventies to late eighties, living alone. Did not choose this product and may not want it. Her cooperation is the single largest delivery risk in the business.",
  },
  {
    role: "Authorized agent · legal",
    name: "The POA or healthcare proxy",
    body: "Often the buyer. Often not. Holds the right to decide what is shared and who may act, which is not the same right as paying the bill.",
  },
];

const INTERNAL: Persona[] = [
  {
    role: "Delivers",
    name: "Offshore check-in VA",
    body: "Handles a roster of parents. The console is built to make her sound like she knows this family, because she does not start out knowing them.",
  },
  {
    role: "Escalates",
    name: "US Care Specialist",
    body: "Picks up what the VA cannot hold: escalations, hard conversations, post-discharge weeks, Concierge families.",
  },
  {
    role: "On call",
    name: "Clinical reviewer (RN or LCSW)",
    body: "Rarely in the product. A read-only view and a hard stop that keeps advice with licensed providers.",
  },
];

function PersonaCard({ p, tone }: { p: Persona; tone: "sage" | "neutral" }) {
  return (
    <li
      className={`rounded-2xl border p-5 ${
        tone === "sage"
          ? "border-sage/25 bg-sage-soft"
          : "border-line bg-surface"
      }`}
    >
      <Kicker>{p.role}</Kicker>
      <h4 className="mt-2 text-[17px] font-semibold text-ink">{p.name}</h4>
      <p className="mt-2 text-[15px] leading-relaxed text-muted">{p.body}</p>
    </li>
  );
}

export function People() {
  return (
    <Section
      id="people"
      eyebrow="Who it's for"
      title="The buyer, the user and the authorized agent are three different people."
      lede="Most elder-care products assume one customer. We model three, with different permissions, because the person paying is not always the person allowed to decide."
      tinted
    >
      <h3 className="text-[15px] font-semibold text-ink">The family</h3>
      <ul className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        {FAMILY.map((p) => (
          <PersonaCard key={p.name} p={p} tone="sage" />
        ))}
      </ul>

      <h3 className="mt-10 text-[15px] font-semibold text-ink">
        The people who deliver it
      </h3>
      <ul className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        {INTERNAL.map((p) => (
          <PersonaCard key={p.name} p={p} tone="neutral" />
        ))}
      </ul>
    </Section>
  );
}
