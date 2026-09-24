import { Section } from "./Section";

/** The v1 scope's epics that carry P0 acceptance criteria. */
const BUILDS = [
  {
    name: "Consent and authorization",
    note: "Built first. Nothing else runs without it.",
  },
  {
    name: "Parent channel",
    note: "Pending the channel decision (CHN-001 is blocked). The prototype assumes a voice call.",
  },
  { name: "Onboarding", note: "Unaided in 15 minutes." },
  {
    name: "Daily check-in",
    note: "Inside the window, three states, no-answer as a real outcome.",
  },
  { name: "Family feed", note: "Today's state above the fold." },
  { name: "Escalation", note: "A named owner and a next action, or resolved." },
  {
    name: "Staff console",
    note: "Queue by closing window, logging in under a minute.",
  },
  { name: "Medications", note: "A list and a prompt. Not a record." },
  {
    name: "Notifications",
    note: "Quiet hours for routine news, never for safety.",
  },
  { name: "Billing", note: "One tier, cancel in the app, a humane exit." },
];

export const CONTACT_EMAIL = "founders@instacare24.example";

export function Ask() {
  return (
    <Section
      id="ask"
      eyebrow="The ask"
      title="Raising a seed round to build the production MVP."
      lede="This prototype shows the loop. The round turns it into a service that runs every day, for real parents, at the targets above."
      tinted
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <h3 className="text-[15px] font-semibold text-ink">
            What the money builds: the ten P0 epics
          </h3>
          <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {BUILDS.map((b) => (
              <li
                key={b.name}
                className="rounded-xl border border-line bg-cream px-4 py-3"
              >
                <p className="text-[15px] font-medium text-ink">{b.name}</p>
                <p className="mt-0.5 text-[13px] leading-snug text-muted">
                  {b.note}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col justify-between rounded-2xl bg-sage p-6 text-white lg:col-span-2">
          <div>
            <p className="font-serif text-[26px] leading-snug">
              Somebody checks on her today. Her family hears within half an
              hour.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-white">
              If you want to talk about the round, v1 or the numbers above,
              write to us.
            </p>
          </div>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="mt-8 inline-flex min-h-11 items-center justify-center rounded-xl bg-surface px-5 py-3 text-[15px] font-medium text-sage-dark hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-sage"
          >
            Contact the founders
          </a>
          <p className="mt-3 text-center text-[13px] text-white">
            {CONTACT_EMAIL} (placeholder)
          </p>
        </div>
      </div>
    </Section>
  );
}
