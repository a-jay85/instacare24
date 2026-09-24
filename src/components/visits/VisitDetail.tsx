"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Banner,
  Button,
  Card,
  Provenance,
  SectionTitle,
  Sheet,
  TextArea,
} from "@/components/ui";
import { openEscalation } from "@/lib/actions";
import {
  authorizedAgent,
  canEditCareInstructions,
  currentMember,
} from "@/lib/permissions";
import { useAccount } from "@/lib/store";
import type { VisitSummary } from "@/lib/types";
import { AI_ALLOWED, AI_PROHIBITED, doctorInline } from "@/lib/visits";
import { BackButton } from "./BackButton";
import { SourceIcon, visitDate } from "./VisitList";

function Section({
  title,
  items,
  children,
}: {
  title: string;
  items: string[];
  children?: React.ReactNode;
}) {
  if (items.length === 0) return null;
  return (
    <section className="mt-7">
      <SectionTitle>{title}</SectionTitle>
      <Card>
        <ul className="space-y-2.5">
          {items.map((t) => (
            <li
              key={t}
              className="flex gap-2.5 text-[15px] leading-relaxed text-ink"
            >
              <span
                aria-hidden
                className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sage"
              />
              {t}
            </li>
          ))}
        </ul>
        {children}
      </Card>
    </section>
  );
}

export function VisitDetail({
  visit,
  onBack,
}: {
  visit: VisitSummary;
  onBack: () => void;
}) {
  const { account, update } = useAccount();
  const [asking, setAsking] = useState(false);
  const [sent, setSent] = useState(false);
  const [note, setNote] = useState("");
  if (!account) return null;

  const name = account.parent.preferredName;
  const specialist = account.careTeam.specialistName;
  const specialistFirst = specialist.split(" ")[0];
  const canEdit = canEditCareInstructions(account);
  // Same rule as Ask (restrictedNote): view access gets the plain summary. The
  // diagnoses and the transcript stay with whoever decides for her.
  const viewOnly = currentMember(account)?.accessLevel === "read";
  const agent = authorizedAgent(account);
  const agentFirst = agent ? agent.name.split(" ")[0] : "Her healthcare proxy";

  const closeAsk = () => {
    setAsking(false);
    setSent(false);
    setNote("");
  };

  const send = () => {
    const me = currentMember(account)?.name ?? "The family";
    update((a) =>
      openEscalation(a, {
        source: "family_request",
        title: `Question about ${name}'s visit with ${doctorInline(visit)}`,
        detail:
          note.trim() ||
          `${me} asked to talk through the ${visit.specialty.toLowerCase()} visit on ${visitDate(visit.date)}.`,
        by: me,
      }),
    );
    setSent(true);
  };

  return (
    <div>
      <BackButton onClick={onBack} />

      <p className="mt-5 flex items-center gap-1.5 text-[13px] font-medium text-faint">
        <SourceIcon source={visit.source} className="h-3.5 w-3.5" />
        {visitDate(visit.date)} · {visit.specialty}
      </p>
      <h1 className="mt-1 font-serif text-[28px] leading-tight text-ink">
        {visit.provider}
      </h1>

      <p className="mt-4 font-serif text-[20px] leading-relaxed text-ink">
        {visit.plain}
      </p>
      <Provenance>
        Summarized by InstaCare24 AI ·{" "}
        {visit.verifiedBy
          ? `checked by ${visit.verifiedBy}`
          : "not checked yet"}
      </Provenance>

      <div className="mt-5">
        <Banner tone="neutral" title="This explains what the doctor said.">
          It is not medical advice. Questions about {name}&apos;s care go to{" "}
          {doctorInline(visit)}&apos;s office.
        </Banner>
      </div>

      {viewOnly ? (
        <p className="mt-5 text-[14px] leading-relaxed text-muted">
          You have view access, so this is the plain summary. The diagnoses and
          the full transcript stay with {agentFirst}. {agentFirst} controls
          what&apos;s shared.
        </p>
      ) : (
        <Section title="Diagnoses mentioned" items={visit.diagnoses} />
      )}
      <Section title="Medication changes" items={visit.medicationChanges}>
        <Link
          href="/care/medications"
          className="mt-4 inline-flex min-h-11 items-center text-[14px] font-medium text-sage-dark"
        >
          {canEdit ? "Update her medication list" : "See her medication list"}{" "}
          <span aria-hidden className="ml-1">
            ›
          </span>
        </Link>
      </Section>
      <Section title="Follow-ups" items={visit.followUps} />
      <Section title="Reminders to set" items={visit.reminders} />

      {viewOnly ? null : (
        <details className="group mt-7 rounded-2xl border border-line bg-surface">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-5 text-[15px] font-medium text-ink">
            Show the full transcript
            <span
              aria-hidden
              className="text-faint transition-transform group-open:rotate-90"
            >
              ›
            </span>
          </summary>
          <p className="border-t border-line px-5 py-4 text-[14px] leading-relaxed whitespace-pre-wrap text-muted">
            {visit.transcript}
          </p>
        </details>
      )}

      <details
        className={`group ${viewOnly ? "mt-7" : "mt-3"} rounded-2xl border border-line bg-surface`}
      >
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-5 text-[15px] font-medium text-ink">
          What the AI will and won&apos;t do
          <span
            aria-hidden
            className="text-faint transition-transform group-open:rotate-90"
          >
            ›
          </span>
        </summary>
        <div className="grid gap-4 border-t border-line px-5 py-4 text-[14px] leading-relaxed">
          <ul className="space-y-1 text-muted">
            {AI_ALLOWED.map((t) => (
              <li key={t}>
                <span aria-hidden className="mr-1.5 text-moss">
                  ✓
                </span>
                {t}
              </li>
            ))}
          </ul>
          <ul className="space-y-1 text-muted">
            {AI_PROHIBITED.map((t) => (
              <li key={t}>
                <span aria-hidden className="mr-1.5 text-clay">
                  ✕
                </span>
                <span className="sr-only">Never: </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </details>

      <div className="mt-7">
        <Button full variant="secondary" onClick={() => setAsking(true)}>
          Ask {specialistFirst} about this visit
        </Button>
      </div>

      <Sheet
        open={asking}
        onClose={closeAsk}
        title={sent ? `${specialistFirst} has this.` : `Ask ${specialistFirst}`}
      >
        {sent ? (
          <>
            <p className="text-[15px] leading-relaxed text-muted">
              {specialist}, your Care Specialist, will call you back, usually
              within 15 minutes during staffed hours. If it needs the doctor,{" "}
              {specialistFirst} will help you reach {doctorInline(visit)}&apos;s
              office.
            </p>
            <div className="mt-6">
              <Button full onClick={closeAsk}>
                Done
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-[15px] leading-relaxed text-muted">
              A real person who has read this summary. {specialistFirst} can
              explain what it says and help you get answers from the
              doctor&apos;s office.
            </p>
            <div className="mt-4">
              <TextArea
                label="What would you like to ask? (optional)"
                value={note}
                onChange={setNote}
                rows={3}
                placeholder={`Should ${name} still be this tired if her heart is fine?`}
              />
            </div>
            <div className="mt-6 space-y-3">
              <Button full onClick={send}>
                Ask for a call back
              </Button>
              <Button full variant="secondary" onClick={closeAsk}>
                Not now
              </Button>
            </div>
          </>
        )}
      </Sheet>
    </div>
  );
}
