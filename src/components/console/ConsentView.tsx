"use client";

import { Banner } from "@/components/ui";
import { roleFor } from "@/lib/console/roles";
import type { ConsentCandidate } from "@/lib/console/synthetic";
import { familyNameOf } from "@/lib/console/subject";
import type { Account } from "@/lib/types";
import { ConsentCard, WithdrawCard, type ConsentStatus } from "./ConsentCalls";

/** AUT-002 / AUT-003 for the live family plus one synthetic pending parent. */
export function ConsentView({
  account,
  me,
  isSpecialist,
  canAct,
  liveDeclined,
  synthetic,
  syntheticStatus,
  onGrant,
  onDeclineLive,
  onWithdraw,
  onRaiseDoubt,
  onClearDoubt,
  onSynthetic,
}: {
  account: Account | null;
  me: string;
  isSpecialist: boolean;
  canAct: boolean;
  liveDeclined: boolean;
  synthetic: ConsentCandidate;
  syntheticStatus: ConsentStatus;
  onGrant: () => void;
  onDeclineLive: () => void;
  onWithdraw: () => void;
  onRaiseDoubt: (note: string) => void;
  onClearDoubt: (note: string) => void;
  onSynthetic: (s: ConsentStatus) => void;
}) {
  const p = account?.parent;
  // The script is read by whoever makes the call, which is the specialist.
  const caller = isSpecialist ? me : roleFor("specialist").name;
  const family = account ? familyNameOf(account) : "";
  const pending =
    p && (p.consent.state === "pending" || p.consent.state === "not_requested");

  return (
    <div className="space-y-5">
      <p className="text-[14px] text-muted">
        Her family agreeing is not her agreeing. Nobody enters the call queue
        until she says yes herself, on a recorded call.
      </p>

      {account && p && account.deceasedAt ? (
        <Banner tone="neutral" title={`${p.fullName}: death reported`}>
          Everything has stopped. The account is with the Care Specialist.
        </Banner>
      ) : account && p && pending ? (
        <ConsentCard
          c={{
            key: "live",
            fullName: p.fullName,
            preferredName: p.preferredName,
            phone: p.phone,
            familyName: family,
            requestedAt: p.consent.requestedAt ?? account.createdAt,
          }}
          me={caller}
          canCall={isSpecialist}
          window={p.checkInWindow.startHour}
          status={liveDeclined ? "declined" : "pending"}
          onYes={onGrant}
          onNo={onDeclineLive}
          capacity={{
            inDoubt: p.capacity.inDoubt,
            note: p.capacity.note,
            onRaise: onRaiseDoubt,
            onClear: onClearDoubt,
          }}
        />
      ) : account && p && p.consent.state === "granted" ? (
        <WithdrawCard
          name={p.fullName}
          preferredName={p.preferredName}
          familyName={family}
          decidedAt={p.consent.decidedAt}
          recordingId={p.consent.recordingId}
          canAct={canAct}
          onWithdraw={onWithdraw}
        />
      ) : account && p ? (
        <Banner tone="amber" title={`${p.fullName} asked us to stop`}>
          Check-ins have stopped. {family} was told she asked us to stop,
          without her reason.
        </Banner>
      ) : null}

      <ConsentCard
        c={synthetic}
        me={caller}
        canCall={isSpecialist}
        status={syntheticStatus}
        onYes={() => onSynthetic("granted")}
        onNo={() => onSynthetic("declined")}
      />
    </div>
  );
}
