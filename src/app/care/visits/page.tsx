"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { scrollAppTop } from "@/components/shell/PhoneFrame";
import { BackLink, Button, Card, PageTitle } from "@/components/ui";
import { AddVisitSheet } from "@/components/visits/AddVisitSheet";
import { Processing } from "@/components/visits/Processing";
import { Recorder } from "@/components/visits/Recorder";
import { VisitDetail } from "@/components/visits/VisitDetail";
import { VisitList } from "@/components/visits/VisitList";
import { todayIso } from "@/lib/actions";
import { useAccount } from "@/lib/store";
import {
  blankVisit,
  formatBytes,
  pipelineStages,
  scriptedSummary,
  uid,
  type VisitSource,
} from "@/lib/visits";

type View =
  | { kind: "list" }
  | { kind: "record" }
  | { kind: "processing"; id: string; source: VisitSource; label: string }
  | { kind: "detail"; id: string };

const STAGE_MS = 900;
const REVIEW_MS = 1800;

export default function VisitsPage() {
  const router = useRouter();
  const { account, ready, update } = useAccount();
  const [view, setView] = useState<View>({ kind: "list" });
  const [adding, setAdding] = useState(false);
  const [step, setStep] = useState(-1);
  const [toast, setToast] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (ready && !account) router.replace("/");
  }, [ready, account, router]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const go = useCallback((next: View) => {
    setView(next);
    scrollAppTop();
  }, []);

  /** Epic 6-8 finished: fill in the scripted summary and mark it checked. */
  const finish = useCallback(
    (id: string, seconds?: number) => {
      update((a) => {
        const verifiedBy = `${a.careTeam.specialistName}, Care Specialist`;
        a.visits = a.visits.map((v) =>
          v.id === id
            ? scriptedSummary(v, a.parent.preferredName, verifiedBy, seconds)
            : v,
        );
        return a;
      });
    },
    [update],
  );

  // A visit left mid-pipeline (the family navigated away) finishes on return.
  const stranded = account?.visits.filter(
    (v) => v.status !== "ready" && v.id !== activeId,
  );
  const strandedKey = stranded?.map((v) => v.id).join(",") ?? "";
  useEffect(() => {
    if (!strandedKey) return;
    const t = setTimeout(
      () => strandedKey.split(",").forEach((id) => finish(id)),
      1500,
    );
    return () => clearTimeout(t);
  }, [strandedKey, finish]);

  const startProcessing = (
    source: VisitSource,
    label: string,
    seconds?: number,
  ) => {
    const id = uid();
    setActiveId(id);
    update((a) => {
      a.visits = [blankVisit({ id, date: todayIso(), source }), ...a.visits];
      return a;
    });
    setAdding(false);
    setStep(-1);
    go({ kind: "processing", id, source, label });

    const stages = pipelineStages(source).length;
    const at = (ms: number, fn: () => void) =>
      timers.current.push(setTimeout(fn, ms));
    for (let i = 0; i <= stages; i++) at(300 + i * STAGE_MS, () => setStep(i));
    const reviewAt = 300 + stages * STAGE_MS;
    at(reviewAt, () =>
      update((a) => {
        a.visits = a.visits.map((v) =>
          v.id === id ? { ...v, status: "pending_review" } : v,
        );
        return a;
      }),
    );
    at(reviewAt + REVIEW_MS, () => {
      finish(id, seconds);
      setActiveId(null);
      go({ kind: "detail", id });
      setToast("Summary ready");
      at(6000, () => setToast(null));
    });
  };

  if (!ready || !account) return null;

  const name = account.parent.preferredName;
  const specialistFirst = account.careTeam.specialistName.split(" ")[0];
  const detail =
    view.kind === "detail"
      ? account.visits.find((v) => v.id === view.id)
      : undefined;

  return (
    <AppShell>
      {toast ? (
        <div
          role="status"
          className="fixed inset-x-4 top-4 z-50 mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl bg-ink px-4 py-3 text-white"
        >
          <span className="text-[14px] leading-snug">
            <span className="font-semibold">{toast}.</span> Checked by{" "}
            {specialistFirst}. We sent it to the family by email and text too.
          </span>
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

      {view.kind === "list" ? (
        <>
          <BackLink href="/care" label="Care" />
          <PageTitle
            title="Doctor visits"
            subtitle={`Record the visit or snap the paperwork. We turn what the doctor said into plain English, so the whole family knows what's next for ${name}.`}
          />
          <Button full onClick={() => setAdding(true)}>
            Add a visit
          </Button>
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
                  No visits yet. After {name}&apos;s next appointment, record it
                  or take a photo of the summary she&apos;s handed.
                </p>
              </Card>
            )}
          </div>
        </>
      ) : null}

      {view.kind === "record" ? (
        <>
          <button
            type="button"
            onClick={() => go({ kind: "list" })}
            className="mt-1 inline-flex min-h-11 items-center gap-1 text-[14px] font-medium text-sage-dark"
          >
            <span aria-hidden>‹</span> All visits
          </button>
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
          <PageTitle title="Working on it" />
          <Processing
            source={view.source}
            label={view.label}
            step={step}
            specialistFirst={specialistFirst}
          />
        </>
      ) : null}

      {view.kind === "detail" && detail ? (
        <VisitDetail visit={detail} onBack={() => go({ kind: "list" })} />
      ) : null}

      <AddVisitSheet
        open={adding}
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
