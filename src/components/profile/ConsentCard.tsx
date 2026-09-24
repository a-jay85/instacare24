"use client";

import { Card, Pill, SectionTitle } from "@/components/ui";
import { grantConsent, withdrawConsent } from "@/lib/actions";
import { CHANNEL_COPY, CONSENT_CALL_SLA_HOURS } from "@/lib/config";
import { useAccount } from "@/lib/store";
import type { Account } from "@/lib/types";
import { dateLabel } from "./parts";

/** AUT-002 / AUT-003: her own consent, separate from the family's. */
export function ConsentCard({ account }: { account: Account }) {
  const { update } = useAccount();
  const { parent } = account;
  const consent = parent.consent;
  const channel = CHANNEL_COPY[parent.channel];

  const pill =
    consent.state === "granted" ? (
      <Pill tone="moss">She agreed</Pill>
    ) : consent.state === "pending" ? (
      <Pill tone="amber">Waiting on her</Pill>
    ) : consent.state === "withdrawn" ? (
      <Pill tone="clay">She withdrew</Pill>
    ) : (
      <Pill tone="neutral">Not asked yet</Pill>
    );

  const shortcut =
    "rounded-lg border border-line px-3 py-1.5 text-[13px] text-muted hover:text-ink";

  return (
    <div className="mt-6">
      <SectionTitle>Her consent</SectionTitle>
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[16px] font-semibold text-ink">
            {parent.preferredName}&apos;s own permission
          </h3>
          {pill}
        </div>
        <p className="text-[14px] leading-relaxed text-muted">
          {consent.state === "granted"
            ? `Recorded on a call${consent.decidedAt ? ` on ${dateLabel(consent.decidedAt)}` : ""}. She can withdraw it at any time by telling whoever calls her — she does not have to come through you.`
            : consent.state === "pending"
              ? `A Care Specialist will ${channel.verb} her within ${CONSENT_CALL_SLA_HOURS} hours. No check-in can be delivered until she has said yes on a recorded call.`
              : consent.state === "withdrawn"
                ? "She told us to stop. Check-ins ended within 24 hours. She did not have to give a reason, and we did not ask for one."
                : "We have not asked her yet."}
        </p>
        {consent.recordingId ? (
          <p className="mt-3 text-[12px] text-faint">
            Recording {consent.recordingId}
          </p>
        ) : null}

        {/* Prototype shortcut — not product. Lets a demo move the state machine. */}
        <div className="mt-4 rounded-xl border border-dashed border-line p-3">
          <p className="mb-2 text-[12px] font-medium uppercase tracking-wider text-faint">
            Prototype shortcut
          </p>
          <div className="flex flex-wrap gap-2">
            {consent.state !== "granted" ? (
              <button
                type="button"
                className={shortcut}
                onClick={() => update((d) => grantConsent(d))}
              >
                She said yes
              </button>
            ) : null}
            {consent.state !== "withdrawn" ? (
              <button
                type="button"
                className={shortcut}
                // AUT-003: she tells the VA, not her family.
                onClick={() =>
                  update((d) => withdrawConsent(d, d.careTeam.vaName))
                }
              >
                She withdrew consent
              </button>
            ) : null}
          </div>
        </div>
      </Card>
    </div>
  );
}
