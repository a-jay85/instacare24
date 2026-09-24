"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { scrollAppTop } from "@/components/shell/PhoneFrame";
import { BackLink, Button, Card, PageTitle } from "@/components/ui";
import { BackButton } from "@/components/visits/BackButton";
import { AddVisitSheet } from "@/components/visits/AddVisitSheet";
import { Processing } from "@/components/visits/Processing";
import { Recorder } from "@/components/visits/Recorder";
import { VisitDetail } from "@/components/visits/VisitDetail";
import { VisitList } from "@/components/visits/VisitList";
import { timeIn } from "@/components/feed/time";
import { parentToday } from "@/lib/actions";
import { visitNotification } from "@/lib/notifications";
import { authorizedAgent, currentMember } from "@/lib/permissions";
import { useAccount } from "@/lib/store";
import {
  approveVisit,
  blankVisit,
  fallbackDue,
  formatBytes,
  pipelineStages,
  toReview,
  uid,
  type VisitSource,
} from "@/lib/visits";

type View =
  | { kind: "list" }
  | { kind: "record" }
  | { kind: "processing"; id: string; source: VisitSource; label: string }
  | { kind: "detail"; id: string };

const STAGE_MS = 900;
/** A visit left mid-pipeline (the family navigated away) moves on after this. */
const STRANDED_MS = 1500;

export default function VisitsPage() {
  const router = useRouter();
  const { account, ready, update } = useAccount();
  const [view, setView] = useState<View>({ kind: "list" });
  const [adding, setAdding] = useState(false);
  const [step, setStep] = useState(-1);
  /** Id of the visit whose "Summary ready" notice is showing. */
  const [toast, setToast] = useState<string | null>(null);
  const viewRef = useRef<View>({ kind: "list" });
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (ready && !account) router.replace("/");
  }, [ready, account, router]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  const go = useCallback((next: View) => {
    viewRef.current = next;
    setView(next);
    scrollAppTop();
  }, []);

  // Epic 8 hand-off. Dana approves in the console (/console, "Visit
  // summaries"); the change arrives here through the shared store. The
  // timer below is only the PROTOTYPE FALLBACK for a presenter on their own.
  // BIL-002: after a death nothing goes out in Dana's name unless a person
  // approves it. Checked on the fresh account, since the timer may predate it.
  const approveAsFallback = useCallback(
    (id: string) =>
      update((a) =>
        a.deceasedAt
          ? a
          : approveVisit(
              a,
              id,
              `${a.careTeam.specialistName}, Care Specialist`,
            ),
      ),
    [update],
  );
  const fallbackKey = (account?.deceasedAt ? [] : (account?.visits ?? []))
    .filter((v) => v.status === "pending_review")
    .map((v) => `${v.id}@${v.draft ? fallbackDue(v.draft) : 0}`)
    .join(",");
  useEffect(() => {
    if (!fallbackKey) return;
    const ts = fallbackKey.split(",").map((entry) => {
      const [id, due] = entry.split("@");
      // Legacy pending visits (no draft) finish like they used to.
      const wait = Number(due) ? Number(due) - Date.now() : STRANDED_MS;
      return setTimeout(() => approveAsFallback(id), Math.max(0, wait));
    });
    return () => ts.forEach(clearTimeout);
  }, [fallbackKey, approveAsFallback]);

  // A visit left mid-pipeline (the family navigated away) goes to review on return.
  const strandedKey = (account?.visits ?? [])
    .filter((v) => v.status === "processing" && v.id !== activeId)
    .map((v) => v.id)
    .join(",");
  useEffect(() => {
    if (!strandedKey) return;
    const ids = strandedKey.split(",");
    const t = setTimeout(
      () =>
        update((a) => {
          a.visits = a.visits.map((v) =>
            ids.includes(v.id) ? toReview(a, v) : v,
          );
          return a;
        }),
      STRANDED_MS,
    );
    return () => clearTimeout(t);
  }, [strandedKey, update]);

  // Toast on the change itself, whether Dana approved in the console tab or
  // the fallback did it here.
  const seen = useRef<Map<string, string> | null>(null);
  useEffect(() => {
    if (!account) return;
    const prev = seen.current;
    const next = new Map(account.visits.map((v) => [v.id, v.status]));
    seen.current = next;
    if (!prev) return;
    for (const v of account.visits) {
      const before = prev.get(v.id);
      if (!before || before === "ready" || v.status !== "ready") continue;
      const now = viewRef.current;
      // Only jump to the summary if they are still watching it being made.
      if (now.kind === "processing" && now.id === v.id)
        go({ kind: "detail", id: v.id });
      setToast(v.id);
    }
  }, [account, go]);

  const startProcessing = (
    source: VisitSource,
    label: string,
    seconds?: number,
  ) => {
    const id = uid();
    setActiveId(id);
    update((a) => {
      a.visits = [
        blankVisit(a, { id, date: parentToday(a), source }),
        ...a.visits,
      ];
      return a;
    });
    setAdding(false);
    setStep(-1);
    go({ kind: "processing", id, source, label });

    const stages = pipelineStages(source).length;
    const at = (ms: number, fn: () => void) =>
      timers.current.push(setTimeout(fn, ms));
    for (let i = 0; i <= stages; i++) at(300 + i * STAGE_MS, () => setStep(i));
    at(300 + stages * STAGE_MS, () => {
      update((a) => {
        a.visits = a.visits.map((v) =>
          v.id === id ? toReview(a, v, seconds) : v,
        );
        return a;
      });
      setActiveId(null);
    });
  };

  if (!ready || !account) return null;

  const name = account.parent.preferredName;
  const specialistFirst = account.careTeam.specialistName.split(" ")[0];
  // Adding a visit writes to her record, so view access only reads them.
  const viewOnly = currentMember(account)?.accessLevel === "read";
  const agent = authorizedAgent(account);
  const agentFirst = agent ? agent.name.split(" ")[0] : "Her healthcare proxy";
  // Say what really went out: quiet hours hold the email and text (NTF-001).
  const toastVisit = toast
    ? account.visits.find((v) => v.id === toast)
    : undefined;
  const mine = visitNotification(
    account,
    toastVisit?.notificationId,
  )?.deliveries.find((d) => d.memberId === account.currentMemberId);
  const myTz =
    currentMember(account)?.familyTimezone ?? account.parent.parentTimezone;
  const toastNote = !mine
    ? ""
    : mine.held
      ? `Your email and text wait for quiet hours and go out at ${timeIn(mine.deliverAt, myTz)}.`
      : "We sent you an email and a text too.";
  // Nothing from a visit reaches the family before a person has checked it.
  const detail =
    view.kind === "detail"
      ? account.visits.find((v) => v.id === view.id && v.status === "ready")
      : undefined;

  return (
    <AppShell>
      {/* Mounted empty so screen readers announce the notice when it appears. */}
      <div role="status" aria-live="polite">
        {toast ? (
          <div className="sheet-panel fixed inset-x-4 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-[45] mx-auto flex max-w-md items-center gap-2 rounded-2xl bg-ink py-2 pr-1 pl-4 text-white">
            <span className="flex-1 text-[14px] leading-snug">
              <span className="font-semibold">Summary ready.</span> Checked by{" "}
              {specialistFirst}. {toastNote}
            </span>
            {view.kind !== "detail" || view.id !== toast ? (
              <button
                type="button"
                onClick={() => {
                  go({ kind: "detail", id: toast });
                  setToast(null);
                }}
                className="min-h-11 shrink-0 rounded-xl px-3 text-[14px] font-semibold text-white underline-offset-2 hover:underline"
              >
                Read it
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setToast(null)}
              aria-label="Dismiss"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white/70 hover:text-white"
            >
              ✕
            </button>
          </div>
        ) : null}
      </div>

      {view.kind === "list" ? (
        <>
          <BackLink href="/care" label="Care" />
          <PageTitle
            title="Doctor visits"
            subtitle={`Record the visit or snap the paperwork. We turn what the doctor said into plain English, so the whole family knows what's next for ${name}.`}
          />
          {viewOnly ? (
            <p className="text-[14px] leading-relaxed text-muted">
              You can read {name}&apos;s visits. {agentFirst} adds new ones.
            </p>
          ) : (
            <Button full onClick={() => setAdding(true)}>
              Add a visit
            </Button>
          )}
          <div className="mt-6">
            {account.visits.length > 0 ? (
              <VisitList
                visits={account.visits}
                specialistFirst={specialistFirst}
                onOpen={(id) => go({ kind: "detail", id })}
              />
            ) : (
              <Card>
                <p className="text-[15px] leading-relaxed text-muted">
                  {viewOnly
                    ? `No visits yet. When ${agentFirst} adds one, the summary shows up here.`
                    : `No visits yet. After ${name}'s next appointment, record it or take a photo of the summary she's handed.`}
                </p>
              </Card>
            )}
          </div>
        </>
      ) : null}

      {view.kind === "record" ? (
        <>
          <BackButton onClick={() => go({ kind: "list" })} />
          <PageTitle title="Record the visit" />
          <Recorder
            name={name}
            onCancel={() => go({ kind: "list" })}
            onStop={(s) =>
              startProcessing(
                "audio",
                `Recording · ${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`,
                s,
              )
            }
          />
        </>
      ) : null}

      {view.kind === "processing" ? (
        <>
          <BackButton onClick={() => go({ kind: "list" })} />
          <PageTitle title="Working on it" />
          <Processing
            source={view.source}
            label={view.label}
            step={step}
            specialistFirst={specialistFirst}
            reading={
              !!account.visits.find((v) => v.id === view.id)?.draft?.openedAt
            }
          />
        </>
      ) : null}

      {view.kind === "detail" && detail ? (
        <VisitDetail visit={detail} onBack={() => go({ kind: "list" })} />
      ) : null}

      <AddVisitSheet
        open={adding && !viewOnly}
        onClose={() => setAdding(false)}
        onRecord={() => {
          setAdding(false);
          go({ kind: "record" });
        }}
        onFile={(source, fileName, size) =>
          startProcessing(source, `${fileName} · ${formatBytes(size)}`)
        }
      />
    </AppShell>
  );
}
