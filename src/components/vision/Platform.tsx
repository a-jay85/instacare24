import { Pill } from "@/components/ui";
import { DemoLink } from "./DemoLink";
import { FOCUS, Section } from "./Section";

const FEATURES = [
  {
    title: "Family AI assistant",
    body: "Ask about today's check-in, medications, the last visit or insurance. It answers from the record, refuses medical advice, and hands off to a person.",
    href: "/assistant",
  },
  {
    title: "Doctor visit summaries",
    body: "Photograph or upload visit notes. The family gets a plain-English summary of what was said, what changed and what happens next.",
    href: "/care/visits",
  },
  {
    title: "Insurance and EOB help",
    body: "An Explanation of Benefits is the statement an insurer sends after a claim. We read it and say what it means and whether anything is owed.",
    href: "/care/insurance",
  },
  {
    title: "Medication reminders",
    body: "A list and a prompt on the same channel as the check-in. Today's acknowledgement only. Not a record, no streaks, no percentages.",
    href: "/care/medications",
  },
];

const INTEGRATIONS = [
  "Epic",
  "Cerner",
  "athenahealth",
  "Aetna",
  "BCBS",
  "UHC",
  "CMS Blue Button",
];

export function Platform() {
  return (
    <Section
      id="platform"
      eyebrow="Beyond the call"
      title="The daily call earns trust. The platform keeps it."
      lede="Once a family trusts us with the daily check-in, the same care team and record can carry the rest of the paperwork of getting old."
      tinted
    >
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {FEATURES.map((f) => (
          <li
            key={f.href}
            className="flex flex-col rounded-2xl border border-line bg-cream p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-[17px] font-semibold text-ink">{f.title}</h3>
              <Pill tone="moss">Live in prototype</Pill>
            </div>
            <p className="mt-2 flex-1 text-[15px] leading-relaxed text-muted">
              {f.body}
            </p>
            <DemoLink
              href={f.href}
              className={`mt-4 inline-flex min-h-11 items-center gap-1 self-start rounded-lg text-[15px] font-medium text-sage-dark underline-offset-4 hover:underline ${FOCUS}`}
            >
              Try it <span aria-hidden>→</span>
              <span className="sr-only"> – {f.title}</span>
            </DemoLink>
          </li>
        ))}
      </ul>

      <div className="mt-10 rounded-2xl border border-line p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-[15px] font-semibold text-ink">Integrations</h3>
          <p className="text-[13px] text-muted">
            Planned via SMART on FHIR / OAuth 2.0. Not connected in the
            prototype.
          </p>
        </div>
        <ul
          className="mt-4 flex flex-wrap gap-2"
          aria-label="Planned integrations"
        >
          {INTEGRATIONS.map((name) => (
            <li
              key={name}
              className="rounded-full border border-line bg-cream px-3.5 py-1.5 text-[14px] text-ink"
            >
              {name}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[14px] leading-relaxed text-muted">
          EHRs (Epic, Cerner, athenahealth) for visit records. Payers (Aetna,
          BCBS, UHC) and CMS Patient Access APIs for coverage and EOBs. Every
          connection goes through the family&apos;s consent first.
        </p>
      </div>
    </Section>
  );
}
