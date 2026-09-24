"use client";

import { useState } from "react";
import { Button, Card, SectionTitle, Sheet } from "@/components/ui";
import { openEscalation, takeOwnership } from "@/lib/actions";
import { authorizedAgent, currentMember } from "@/lib/permissions";
import { useAccount } from "@/lib/store";
import type { Account } from "@/lib/types";
import { dateLabel } from "./parts";

/**
 * BIL-002: offboard on death without an automated indignity. Recording it
 * stops billing, every check-in and every message, and hands the family to a
 * named Care Specialist. The escalation carries an owner and a next action from
 * the start (ESC-002), so it never sits in a queue unclaimed.
 */
export function ReportDeath({ account }: { account: Account }) {
  const { update } = useAccount();
  const [open, setOpen] = useState(false);
  const me = currentMember(account);
  const agent = authorizedAgent(account);
  const name = account.parent.preferredName;
  const specialist = account.careTeam.specialistName;

  const confirm = () => {
    update((d) => {
      d.deceasedAt = new Date().toISOString();
      openEscalation(d, {
        source: "family_request",
        title: `${d.parent.preferredName} has died`,
        detail: `Reported by ${me?.name ?? "the family"}. Billing, check-ins and all automated messages stopped.`,
        by: me?.name ?? "The family",
      });
      return takeOwnership(
        d,
        d.escalations[0].id,
        d.careTeam.specialistName,
        "Call the family personally. No automated contact.",
      );
    });
    setOpen(false);
  };

  return (
    <div className="mt-8">
      <SectionTitle>If something changes</SectionTitle>
      <Card>
        {me?.isAuthorizedAgent ? (
          <>
            <p className="text-[14px] leading-relaxed text-muted">
              Tell us here and everything stops the same day. You will not have
              to explain it to anyone twice.
            </p>
            <div className="mt-4">
              <Button variant="secondary" onClick={() => setOpen(true)}>
                Tell us {name} has died
              </Button>
            </div>
          </>
        ) : (
          <p className="text-[14px] leading-relaxed text-muted">
            {agent ? agent.name.split(" ")[0] : "Her healthcare proxy"} can
            record it here. Or tap Talk to someone and {specialist} will take
            care of it with you.
          </p>
        )}
      </Card>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="We are so sorry."
      >
        <p className="text-[15px] leading-relaxed text-muted">
          When you confirm, we stop everything today: the daily calls, the
          medicine reminders and the billing. You will not get another automated
          message from us.
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          {specialist}, your Care Specialist, will call you herself. There is no
          rush, and nothing else you need to do.
        </p>
        <div className="mt-6 space-y-3">
          <Button full onClick={confirm}>
            Yes, record this
          </Button>
          <Button full variant="secondary" onClick={() => setOpen(false)}>
            Not now
          </Button>
        </div>
      </Sheet>
    </div>
  );
}

/** BIL-002 terminal state. Calm, specific, and nothing to act on. */
export function DeceasedState({ account }: { account: Account }) {
  const name = account.parent.preferredName;
  const when = dateLabel(account.deceasedAt ?? new Date(0).toISOString());
  return (
    <div className="mt-6">
      <Card>
        <p className="font-serif text-[22px] leading-snug text-ink">
          We are so sorry about {name}.
        </p>
        <ul className="mt-4 space-y-2.5 text-[15px] leading-relaxed text-muted">
          <li>Billing stopped on {when}. You will not be charged again.</li>
          <li>
            The daily calls, the medicine reminders and every message from us
            have stopped.
          </li>
          <li>
            {account.careTeam.specialistName} will call you herself, whenever it
            suits you.
          </li>
        </ul>
      </Card>
    </div>
  );
}
