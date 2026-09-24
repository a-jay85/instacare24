"use client";

import { useState } from "react";
import {
  Banner,
  Button,
  Card,
  LockNote,
  RadioCard,
  SectionTitle,
  Sheet,
} from "@/components/ui";
import { canManageBilling, payer } from "@/lib/permissions";
import { useAccount } from "@/lib/store";
import type { Account } from "@/lib/types";
import { Row, dateLabel, useReturnFocus } from "./parts";

/**
 * BIL-003 prototype: `pausedUntil` is not on the shared Subscription type yet.
 * It rides on the stored subscription object (the store keeps unknown fields),
 * so it survives a reload and resets with a demo Load.
 */
type PausableSubscription = Account["subscription"] & { pausedUntil?: string };

export function activePause(account: Account): string | null {
  const until = (account.subscription as PausableSubscription).pausedUntil;
  return until && new Date(until) > new Date() ? until : null;
}

const PAUSE_OPTIONS = [
  { days: 14, title: "Two weeks", description: "A short hospital stay." },
  {
    days: 30,
    title: "A month",
    description: "Rehab, or a stretch staying with family.",
  },
];

/**
 * BIL-003 (P1): pause instead of cancel. Saved on the subscription, but the
 * check-in loop does not read it yet (see PausableSubscription). It sits beside
 * cancel, never in front of it, so BIL-001's "cancel without a retention gate"
 * still holds.
 */
function PauseSheet({
  open,
  onClose,
  onPause,
  account,
}: {
  open: boolean;
  onClose: () => void;
  onPause: (days: number) => void;
  account: Account;
}) {
  const [days, setDays] = useState(PAUSE_OPTIONS[0].days);
  const name = account.parent.preferredName;
  useReturnFocus(open);
  return (
    <Sheet open={open} onClose={onClose} title="Pause for a while">
      <p className="text-[15px] leading-relaxed text-muted">
        If {name} is in hospital or staying with family, you can pause instead
        of cancelling. The calls stop and billing stops. Her window, her notes
        and her medicines stay exactly as they are.
      </p>
      <div className="mt-4 space-y-2.5">
        {PAUSE_OPTIONS.map((o) => (
          <RadioCard
            key={o.days}
            selected={days === o.days}
            onSelect={() => setDays(o.days)}
            title={o.title}
            description={o.description}
          />
        ))}
      </div>
      <p className="mt-4 text-[14px] leading-relaxed text-muted">
        If she is in hospital, tell {account.careTeam.specialistName}. The first
        days home are when a daily call matters most, and she can plan them with
        you.
      </p>
      <div className="mt-6 space-y-3">
        <Button full onClick={() => onPause(days)}>
          Pause the service
        </Button>
        <Button full variant="secondary" onClick={onClose}>
          Not now
        </Button>
      </div>
    </Sheet>
  );
}

/** Read once by the profile page right after a cancel. Module state, not storage. */
export const cancelReceipt: { name: string; at: string | null } = {
  name: "",
  at: null,
};

/** BIL-001: one tier, card on file, cancel without a call, a chat or a gate. */
export function Subscription({ account }: { account: Account }) {
  const { clear, update } = useAccount();
  const [showCancel, setShowCancel] = useState(false);
  const [showPause, setShowPause] = useState(false);
  const pausedUntil = activePause(account);
  const canBill = canManageBilling(account);
  const holder = payer(account);

  const setPause = (until: string | undefined) =>
    update((d) => {
      (d.subscription as PausableSubscription).pausedUntil = until;
      return d;
    });
  const pause = (days: number) => {
    const until = new Date();
    until.setDate(until.getDate() + days);
    setPause(until.toISOString());
    setShowPause(false);
  };

  return (
    <div className="mt-8">
      <SectionTitle>Subscription</SectionTitle>
      <Card>
        <Row
          label="Plan"
          value={`$${account.subscription.priceMonthly} / month`}
        />
        <Row
          label="Card"
          value={`•••• ${account.subscription.cardLast4 ?? "0000"}`}
        />
        {pausedUntil ? (
          <div className="mt-4 space-y-3">
            <Banner
              tone="sage"
              title={`Paused until ${dateLabel(pausedUntil)}.`}
            >
              No calls and no billing until then. We will pick up where we left
              off, with the same people.
            </Banner>
          </div>
        ) : null}
        {!canBill ? (
          <LockNote>
            {holder
              ? `The card belongs to ${holder.name}. Only ${holder.name.split(" ")[0]} can pause or cancel.`
              : "The card belongs to the subscriber. Only they can pause or cancel."}
          </LockNote>
        ) : showCancel ? (
          <div className="mt-4 space-y-3">
            <Banner tone="clay" title="Cancel the subscription?">
              Billing stops today and the check-ins stop with it. Nobody will
              call you to talk you out of it.
            </Banner>
            <div className="flex gap-3">
              <Button
                variant="danger"
                onClick={() => {
                  // BIL-001: done on the spot. The profile page shows a short
                  // receipt instead of dropping her on the marketing page.
                  cancelReceipt.name = account.parent.preferredName;
                  cancelReceipt.at = new Date().toISOString();
                  clear();
                }}
              >
                Yes, cancel
              </Button>
              <Button variant="secondary" onClick={() => setShowCancel(false)}>
                Keep it
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap gap-3">
            {pausedUntil ? (
              <Button onClick={() => setPause(undefined)}>Restart now</Button>
            ) : null}
            <Button variant="secondary" onClick={() => setShowCancel(true)}>
              Cancel subscription
            </Button>
            {pausedUntil ? null : (
              <Button variant="ghost" onClick={() => setShowPause(true)}>
                Pause instead
              </Button>
            )}
          </div>
        )}
      </Card>
      {canBill ? (
        <PauseSheet
          open={showPause}
          onClose={() => setShowPause(false)}
          onPause={pause}
          account={account}
        />
      ) : null}
    </div>
  );
}
