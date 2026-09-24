"use client";

import { useState } from "react";
import { Banner, Pill } from "@/components/ui";
import type { ConsentCandidate } from "@/lib/console/synthetic";
import { clockLabel, windowLabel } from "@/lib/console/time";
import { CButton, Panel } from "./primitives";

export type ConsentStatus = "pending" | "granted" | "declined";

function Script({
  c,
  me,
  window,
}: {
  c: ConsentCandidate;
  me: string;
  window?: number;
}) {
  return (
    <div className="rounded-xl border-l-4 border-sage bg-sage-soft px-4 py-3 text-[15px] leading-relaxed text-ink">
      <p>
        &ldquo;Hello, is this {c.preferredName}? My name is {me}, I&apos;m
        calling from InstaCare24. {c.familyName} asked us to give you a short
        phone call each day
        {window !== undefined ? `, between ${windowLabel(window).replace(" – ", " and ")}` : ""}, just
        to see how you are.
      </p>
      <p className="mt-2">
        This call is recorded so we have your answer on file. Would that be
        alright with you? You can say no, and you can tell us to stop at any
        time. We only send {c.familyName} a short note after each call.&rdquo;
      </p>
      <p className="mt-3 text-[13px] text-muted">
        If she seems unsure what she is agreeing to, stop. Do not record a yes.
        Mark &ldquo;not now&rdquo; and leave it to a person, never a checkbox.
      </p>
    </div>
  );
}

/** AUT-002: the parent's own yes, on a recorded call, before anything runs. */
export function ConsentCard({
  c,
  me,
  canCall,
  window,
  status,
  onYes,
  onNo,
}: {
  c: ConsentCandidate;
  me: string;
  canCall: boolean;
  window?: number;
  status: ConsentStatus;
  onYes: () => void;
  onNo: () => void;
}) {
  return (
    <Panel
      title={`${c.fullName} · consent call needed`}
      action={
        <span className="text-[12px] text-faint">
          Requested {clockLabel(c.requestedAt)} · {c.phone}
        </span>
      }
    >
      {status === "granted" ? (
        <Banner
          tone="moss"
          title={`${c.preferredName} said yes. Recording saved.`}
        >
          She is in the VA call queue from her next window.
        </Banner>
      ) : status === "declined" ? (
        <Banner tone="amber" title={`${c.preferredName} said no, or not now.`}>
          No check-ins start. {c.familyName} is told honestly, and a Care
          Specialist talks it through with them. We do not keep calling.
        </Banner>
      ) : (
        <>
          <Script c={c} me={me} window={window} />
          <div className="mt-4 flex flex-wrap gap-2">
            <CButton onClick={onYes} disabled={!canCall}>
              She said yes (recording saved)
            </CButton>
            <CButton variant="secondary" onClick={onNo} disabled={!canCall}>
              She said no / not now
            </CButton>
          </div>
          {!canCall ? (
            <p className="mt-2 text-[13px] text-muted">
              Consent calls are made by the Care Specialist. Switch to Dana
              Brooks to make this call.
            </p>
          ) : null}
        </>
      )}
    </Panel>
  );
}

/** AUT-003: she can stop it. The family is told that she did, never why. */
export function WithdrawCard({
  name,
  preferredName,
  familyName,
  decidedAt,
  recordingId,
  canAct,
  onWithdraw,
}: {
  name: string;
  preferredName: string;
  familyName: string;
  decidedAt?: string;
  recordingId?: string;
  canAct: boolean;
  onWithdraw: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  return (
    <Panel title={`${name} · consented`}>
      <div className="flex flex-wrap items-center gap-2 text-[14px] text-muted">
        <Pill tone="moss">Consent on file</Pill>
        {decidedAt ? (
          <span>
            Given{" "}
            {new Date(decidedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
            {recordingId ? ` · Recording ${recordingId}` : ""}
          </span>
        ) : recordingId ? (
          <span>Recording {recordingId}</span>
        ) : null}
      </div>
      {confirming ? (
        <div className="mt-4 rounded-xl border border-clay/30 bg-clay-soft p-4">
          <p className="text-[15px] text-ink">
            Check-ins for {preferredName} stop within 24 hours. {familyName}{" "}
            will be told she asked us to stop. Her reason stays with us.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <CButton variant="danger" onClick={onWithdraw}>
              Confirm: she asked us to stop
            </CButton>
            <CButton variant="ghost" onClick={() => setConfirming(false)}>
              Cancel
            </CButton>
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <CButton
            variant="danger"
            disabled={!canAct}
            onClick={() => setConfirming(true)}
          >
            She asked us to stop
          </CButton>
        </div>
      )}
    </Panel>
  );
}
