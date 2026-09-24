"use client";

import Link from "next/link";
import { useState } from "react";
import { CallQueue } from "@/components/console/CallQueue";
import { CallScreen } from "@/components/console/CallScreen";
import type { ConsentStatus } from "@/components/console/ConsentCalls";
import { ConsentView } from "@/components/console/ConsentView";
import { ConsoleShell } from "@/components/console/ConsoleShell";
import { isOverdue } from "@/components/console/EscalationRow";
import { EscalationsView } from "@/components/console/EscalationsView";
import { MetricsStrip } from "@/components/console/MetricsStrip";
import { VisitReview } from "@/components/console/VisitReview";
import { ConsoleHeader } from "@/components/console/primitives";
import { Banner } from "@/components/ui";
import {
  canDeliver,
  consentDeclined,
  declineConsent,
  grantConsent,
  logCheckIn,
  resolveEscalation,
  takeOwnership,
  withdrawConsent,
} from "@/lib/actions";
import { computeMetrics } from "@/lib/console/metrics";
import {
  roleFor,
  type ConsoleRole,
  type ConsoleView,
} from "@/lib/console/roles";
import { buildRoster } from "@/lib/console/roster";
import {
  applyToEscalation,
  buildSyntheticEscalations,
  syntheticConsent,
  type ConsoleEscalation,
} from "@/lib/console/synthetic";
import {
  LIVE_KEY,
  logLocally,
  subjectFromAccount,
  type CallSubject,
  type LogInput,
} from "@/lib/console/subject";
import { useNow } from "@/lib/console/time";
import { useAccount } from "@/lib/store";
import { awaitingReview } from "@/lib/visits";
import type { Account, CheckInRecord } from "@/lib/types";

const TODAY_LABEL = () =>
  new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

/**
 * Internal staff console. Synthetic roster and escalations live in page state
 * (this tab only); the live family goes through the shared store, so every
 * log here lands in the family feed in the other tab.
 */
export default function ConsolePage() {
  const { account, ready, update } = useAccount();
  const now = useNow();

  const [role, setRole] = useState<ConsoleRole>("va");
  const [view, setView] = useState<ConsoleView>("queue");
  const [openKey, setOpenKey] = useState<string | null>(null);
  // Lazy initialisers run again on the client; nothing below renders until
  // `now` is set, so the prerendered values are never shown.
  const [roster] = useState(() => buildRoster(Date.now()));
  const [rosterLogs, setRosterLogs] = useState<Record<string, CheckInRecord>>(
    {},
  );
  const [synth, setSynth] = useState<ConsoleEscalation[]>(() =>
    buildSyntheticEscalations(Date.now()),
  );
  const [consentCandidate] = useState(() => syntheticConsent(Date.now()));
  const [consentStatus, setConsentStatus] = useState<ConsentStatus>("pending");
  const [clinicalNotes, setClinicalNotes] = useState<Record<string, string[]>>(
    {},
  );
  const [loggingSeconds, setLoggingSeconds] = useState<number[]>([]);

  if (!ready || now === 0)
    return (
      <p className="p-10 text-[15px] text-muted" aria-live="polite">
        Opening the console…
      </p>
    );

  const me = roleFor(role).name;
  const current: ConsoleView =
    role === "clinical"
      ? "escalations"
      : view === "visits" && role !== "specialist"
        ? "queue"
        : view;

  const liveRows: ConsoleEscalation[] = account
    ? account.escalations.map((esc) => ({
        parentName: account.parent.fullName,
        tz: account.parent.parentTimezone,
        live: true,
        esc,
      }))
    : [];
  const escRows = [...liveRows, ...synth];

  const subjects: CallSubject[] = [
    ...(account && canDeliver(account) ? [subjectFromAccount(account)] : []),
    ...roster.map((s) => ({
      ...s,
      today: rosterLogs[s.key] ?? s.today,
      openEscalations: synth
        .filter((e) => e.parentName === s.fullName && !e.esc.resolvedAt)
        .map((e) => e.esc),
    })),
  ];
  const selected = subjects.find((s) => s.key === openKey) ?? null;

  const metrics = computeMetrics({
    subjects,
    escalations: escRows,
    loggingSeconds,
    now,
  });

  const openEsc = escRows.filter((r) => !r.esc.resolvedAt);
  const livePending =
    account &&
    !account.deceasedAt &&
    !consentDeclined(account) &&
    ["pending", "not_requested"].includes(account.parent.consent.state);
  const badges = {
    queue: { count: subjects.filter((s) => !s.today).length },
    escalations: {
      count: openEsc.length,
      alarm: openEsc.some((r) => isOverdue(r, now)),
    },
    visits: {
      count: account ? awaitingReview(account).length : 0,
    },
    consent: {
      count: (livePending ? 1 : 0) + (consentStatus === "pending" ? 1 : 0),
    },
  };

  function onLog(s: CallSubject, input: LogInput, seconds: number | null) {
    if (seconds !== null) setLoggingSeconds((l) => [...l, seconds]);
    if (s.key === LIVE_KEY) {
      update((a) => logCheckIn(a, input));
      return;
    }
    const { record, escalations } = logLocally(s, input);
    setRosterLogs((m) => ({ ...m, [s.key]: record }));
    setSynth((list) => [
      ...escalations.map((esc) => ({
        parentName: s.fullName,
        tz: s.tz,
        live: false,
        esc,
      })),
      ...list,
    ]);
  }

  function onEscalation(row: ConsoleEscalation, fn: (a: Account) => Account) {
    if (row.live) update(fn);
    else
      setSynth((list) =>
        list.map((r) =>
          r.esc.id === row.esc.id ? applyToEscalation(r, fn) : r,
        ),
      );
  }

  function go(v: ConsoleView) {
    setView(v);
    setOpenKey(null);
  }

  return (
    <ConsoleShell
      role={role}
      onRole={(r) => {
        setRole(r);
        if (r === "clinical") setOpenKey(null);
      }}
      view={current}
      onView={go}
      badges={badges}
    >
      {current === "queue" && selected ? (
        <CallScreen
          key={selected.key}
          s={selected}
          now={now}
          vaName={me}
          onLog={(input, secs) => onLog(selected, input, secs)}
          onBack={() => setOpenKey(null)}
          onEscalations={() => go("escalations")}
        />
      ) : current === "queue" ? (
        <>
          <ConsoleHeader
            title="Call queue"
            subtitle={TODAY_LABEL()}
            aside={
              <span className="text-[13px] text-muted">Signed in as {me}</span>
            }
          />
          <div className="mb-6">
            <MetricsStrip metrics={metrics} />
          </div>
          {!account ? (
            <div className="mb-6">
              <Banner tone="amber" title="No live family in this browser">
                The roster below is synthetic. Load a family from{" "}
                <Link href="/demo" className="underline">
                  Demo controls
                </Link>{" "}
                to log a call that lands in the family feed.
              </Banner>
            </div>
          ) : !canDeliver(account) ? (
            <div className="mb-6">
              <Banner
                tone="neutral"
                title={`${account.parent.fullName} is not in the queue`}
              >
                {account.deceasedAt
                  ? "A death was reported. Nothing is sent or called."
                  : account.parent.consent.state === "withdrawn"
                    ? "She asked us to stop. No check-ins."
                    : account.parent.consent.state === "granted"
                      ? "The family paused the service. Calls resume on their own."
                      : "She has not given her own consent yet. See Consent calls."}
              </Banner>
            </div>
          ) : null}
          <CallQueue
            subjects={subjects}
            now={now}
            vaName={me}
            onOpen={setOpenKey}
          />
        </>
      ) : current === "escalations" ? (
        <>
          <ConsoleHeader
            title="Escalations"
            subtitle="Owned with a next action, or resolved. Oldest unowned first."
          />
          <EscalationsView
            rows={escRows}
            now={now}
            me={me}
            readOnly={role === "clinical"}
            clinicalNotes={clinicalNotes}
            onTake={(row, next) =>
              onEscalation(row, (a) => takeOwnership(a, row.esc.id, me, next))
            }
            onResolve={(row, note) =>
              onEscalation(row, (a) =>
                resolveEscalation(a, row.esc.id, me, note),
              )
            }
            onClinicalNote={(id, text) =>
              setClinicalNotes((m) => ({
                ...m,
                [id]: [...(m[id] ?? []), text],
              }))
            }
          />
        </>
      ) : current === "visits" ? (
        <>
          <VisitReview account={account} now={now} me={me} />
        </>
      ) : current === "consent" ? (
        <>
          <ConsoleHeader
            title="Consent calls"
            subtitle="Her yes, in her words, on a recording."
          />
          <ConsentView
            account={account}
            me={me}
            isSpecialist={role === "specialist"}
            canAct={role !== "clinical"}
            liveDeclined={!!account && consentDeclined(account)}
            synthetic={consentCandidate}
            syntheticStatus={consentStatus}
            onGrant={() => update((a) => grantConsent(a))}
            onDeclineLive={() => update((a) => declineConsent(a, me))}
            onWithdraw={() => update((a) => withdrawConsent(a, me))}
            onSynthetic={setConsentStatus}
          />
        </>
      ) : (
        <>
          <ConsoleHeader
            title="Today's metrics"
            subtitle="Where the unit economics live. Synthetic baseline plus this session."
          />
          <MetricsStrip metrics={metrics} detailed />
        </>
      )}
    </ConsoleShell>
  );
}
