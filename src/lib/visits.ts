import { notifyFamily } from "./notifications";
import { currentMember } from "./permissions";
import type {
  Account,
  ReviewFlag,
  VisitAuditEntry,
  VisitDraft,
  VisitSummary,
} from "./types";

/**
 * Doctor visit transcription & summary (docs/sources/doc-transcription.md).
 * Nothing here calls a real model: the "AI output" is a scripted sample, and
 * the pipeline stages are timers. Labelled as such on purpose.
 */

export type VisitSource = VisitSummary["source"];

/** Epic 1 "Is the file type and size allowed?" The PDF leaves the limits open; these are ours. */
export const UPLOAD_LIMITS = {
  maxMb: 20,
  types: ["JPG", "PNG", "PDF"],
  audioMinutes: 90,
};

const EXT_KIND: Record<string, VisitSource> = {
  jpg: "photo",
  jpeg: "photo",
  png: "photo",
  pdf: "pdf",
};

const MIME_KIND: Record<string, VisitSource> = {
  "image/jpeg": "photo",
  "image/png": "photo",
  "application/pdf": "pdf",
};

export type FileCheck =
  { ok: true; kind: VisitSource } | { ok: false; reason: string };

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** MIME is often empty (or wrong) in browsers, so the extension counts too. */
export function checkFile(name: string, size: number, type: string): FileCheck {
  const ext = name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
  const kind = MIME_KIND[type] ?? EXT_KIND[ext];
  if (!kind) {
    const label = ext ? `a .${ext} file` : "a file type we can't recognize";
    return {
      ok: false,
      reason: `That is ${label}. We can read JPG, PNG or PDF. iPhone photos saved as HEIC can be re-shared as JPG.`,
    };
  }
  if (size > UPLOAD_LIMITS.maxMb * 1024 * 1024) {
    return {
      ok: false,
      reason: `It is ${formatBytes(size)}. The limit is ${UPLOAD_LIMITS.maxMb} MB. A photo of each page usually fits.`,
    };
  }
  return { ok: true, kind };
}

/** The workflow's Epics 1-8, in plain words. The last one may hand off to a human. */
export function pipelineStages(source: VisitSource) {
  return [
    {
      title: "Encrypted and uploaded",
      detail:
        "Locked in transit and at rest. Only her family and care team can open it.",
    },
    {
      title: "Checking the file is safe",
      detail: "Scanned for viruses and checked it is what it says it is.",
    },
    {
      title: "Reading the words",
      detail:
        source === "audio"
          ? "Turning the conversation into text and telling the voices apart."
          : "Reading the page (OCR), line by line.",
    },

    {
      title: "Writing the plain-English summary",
      detail: "Diagnoses, medicine changes, follow-ups and reminders.",
    },
    {
      title: "Safety check",
      detail: "No advice, nothing invented. A person reviews it when needed.",
    },
  ];
}

/** Workflow's "Allowed / Prohibited AI Actions" card, in family words. */
export const AI_ALLOWED = [
  "Explain what was said in plain words",
  "List diagnoses the doctor wrote down",
  "List medicines the doctor mentioned",
  "List follow-ups and reminders",
];

export const AI_PROHIBITED = [
  "Diagnose anything",
  "Prescribe or change medicines",
  "Recommend treatments",
  "Interpret test results",
  "Predict how things will go",
];

export function uid(): string {
  return `visit_${Math.random().toString(36).slice(2, 9)}`;
}

function inDays(from: string, days: number): string {
  const d = new Date(from + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString(undefined, { month: "long", day: "numeric" });
}

/** Shown when she has no earlier visit to take a doctor's name from. */
export const UNNAMED_DOCTOR = "Her doctor";

/** The doctor's name for the middle of a sentence: "with her doctor". */
export function doctorInline(visit: Pick<VisitSummary, "provider">): string {
  return visit.provider === UNNAMED_DOCTOR ? "her doctor" : visit.provider;
}

/** Her own doctor, from her last visit: primary care first, like the care team card. */
function herDoctor(
  account: Account,
): Pick<VisitSummary, "provider" | "specialty"> {
  const byDate = account.visits
    .filter((v) => v.provider !== UNNAMED_DOCTOR)
    .sort((a, b) => b.date.localeCompare(a.date));
  const last = byDate.find((v) => v.specialty === "Primary care") ?? byDate[0];
  return last
    ? { provider: last.provider, specialty: last.specialty }
    : { provider: UNNAMED_DOCTOR, specialty: "Doctor visit" };
}

/** A new visit as it lands: no summary yet, so nothing unchecked leaks elsewhere. */
export function blankVisit(
  account: Account,
  input: { id: string; date: string; source: VisitSource },
): VisitSummary {
  return {
    ...input,
    ...herDoctor(account),
    status: "processing",
    transcript: "",
    plain: "",
    diagnoses: [],
    medicationChanges: [],
    followUps: [],
    reminders: [],
  };
}

/**
 * PROTOTYPE FALLBACK. In production a draft waits in the Human Review Queue
 * until a Care Specialist approves it. For a solo presenter with no console
 * open, the family's visits page approves it in Dana's name after this long.
 */
export const REVIEW_FALLBACK_MS = 20_000;
/** Once a reviewer has it open, the fallback waits this long instead. */
export const REVIEW_OPENED_FALLBACK_MS = 3 * 60_000;

/** When the prototype fallback will approve this draft, as epoch ms. */
export function fallbackDue(draft: VisitDraft): number {
  return draft.openedAt
    ? Date.parse(draft.openedAt) + REVIEW_OPENED_FALLBACK_MS
    : Date.parse(draft.fallbackAt);
}

/**
 * SCRIPTED sample output, standing in for speech-to-text/OCR + summariser and
 * the Epic 7-8 checks. It reports what the doctor said. It does not interpret
 * (workflow Epic 5). Built from her own account: her doctor, her medicines,
 * nothing she does not have. The result waits for a person: see `approveVisit`.
 */
export function scriptedDraft(
  account: Account,
  visit: VisitSummary,
  seconds?: number,
  nowMs = Date.now(),
): VisitDraft {
  const name = account.parent.preferredName;
  const followUp = inDays(visit.date, 90);
  const audio = visit.source === "audio";
  const named = visit.provider !== UNNAMED_DOCTOR;
  // "Dr. Elena Alvarez" -> "Dr. Alvarez"; spoken lines need a short name.
  const dr = named
    ? `Dr. ${visit.provider.split(" ").slice(-1)[0]}`
    : "The doctor";
  const drLower = named ? dr : "the doctor";
  const meds = account.medications.filter(
    (m) => m.schedule.kind === "scheduled",
  );
  const medWords = meds.map((m) => `${m.name.toLowerCase()} ${m.dose}`);
  const medList =
    medWords.length > 1
      ? `${medWords.slice(0, -1).join(", ")} and ${medWords.slice(-1)[0]}`
      : (medWords[0] ?? "");
  // With no earlier visit on file, the doctor cannot compare to "last time".
  const sameLine = named
    ? "Everything I checked today looks the same as last time."
    : "I didn't find anything new today.";
  const medLine = meds.length
    ? `Keep taking your ${medList}, the same as now. No changes today.`
    : "No medicines came up today.";

  const transcript = audio
    ? [
        `Recorded in the exam room${seconds ? `, ${Math.max(1, Math.round(seconds / 60))} min` : ""}. Speakers identified: ${drLower}, ${name}.`,
        "",
        `${dr}: ${name}, how have you been ${named ? "since I last saw you" : "feeling"}?`,
        `${name}: About the same. A little tired some afternoons.`,
        `${dr}: ${sameLine}`,
        `${dr}: ${medLine}`,
        `${dr}: Keep walking when you can. I'd like to see you again in three months.`,
        `${name}: Three months. All right. Thank you.`,
      ].join("\n")
    : [
        `${visit.source === "pdf" ? "PDF" : "Photo of"} after-visit summary, 1 page. Read with OCR; confidence high except one handwritten line.`,
        "",
        `${visit.specialty}, ${named ? visit.provider : "doctor's name not legible"}.`,
        named ? "Exam: unchanged from last visit." : "Exam: no new findings.",
        meds.length
          ? `Medications: continue ${medList}. No changes.`
          : "Medications: none discussed.",
        "Plan: stay active. Return to clinic in 3 months.",
        'Handwritten in the margin: "walk daily"',
      ].join("\n");

  const flags: ReviewFlag[] = [
    audio
      ? meds.length
        ? {
            kind: "low_confidence",
            title: "Low confidence: one line was hard to hear",
            quote: medLine,
            note: "Crosstalk over the doses (78% confidence). Check them against her medication list before it goes out.",
          }
        : {
            kind: "low_confidence",
            title: "Low confidence: one line was hard to hear",
            quote: "I'd like to see you again in three months.",
            note: 'Crosstalk over "three months" (78% confidence). Check the follow-up timing before it goes out.',
          }
      : {
          kind: "low_confidence",
          title: "Low confidence: handwriting",
          quote: "walk daily",
          note: 'Read at 64% confidence. The draft takes it as "walk every day", which matches the typed plan.',
        },
    {
      kind: "missing_info",
      title: "Missing: exact follow-up date",
      quote: audio
        ? "I'd like to see you again in three months."
        : "Return to clinic in 3 months.",
      note: `No date was given. The draft says "around ${followUp}". Check with the office before a reminder goes out.`,
    },
    {
      kind: "guardrail",
      title: "Safety check held back a sentence",
      quote: `This means ${name} is healthy.`,
      note: `Reads as a judgement about her health. ${named ? dr : "The doctor"} said only "${sameLine}" The draft keeps those words.`,
    },
  ];

  return {
    transcript,
    plain: `${named ? `${dr} said nothing had changed since ${name}'s last visit.` : `The doctor found nothing new at ${name}'s visit.`} ${meds.length ? "Her medicines stay the same." : "No medicines came up."} ${named ? dr : "The doctor"} wants to see her again in three months.`,
    diagnoses: [
      `No new diagnosis. ${named ? `${dr} said things looked the same as last time.` : "The doctor found nothing new."}`,
    ],
    medicationChanges: meds.length
      ? [`No change. Keep taking ${medList} as before.`]
      : [],
    followUps: [`Follow-up with ${drLower} around ${followUp}`],
    reminders: [
      `Book the three-month visit with ${named ? `${dr}'s` : "the doctor's"} office`,
      "Keep walking when she can",
      ...(meds.length ? ["Bring her medication list to the next visit"] : []),
    ],
    flags,
    draftedAt: new Date(nowMs).toISOString(),
    fallbackAt: new Date(nowMs + REVIEW_FALLBACK_MS).toISOString(),
  };
}

/** The pipeline is done: the draft goes to the Human Review Queue. */
export function toReview(
  account: Account,
  visit: VisitSummary,
  seconds?: number,
): VisitSummary {
  if (visit.status === "ready" || visit.draft) return visit;
  return {
    ...visit,
    status: "pending_review",
    draft: scriptedDraft(account, visit, seconds),
  };
}

/** Epic 8 queue: drafts waiting for a person, oldest first. */
export function awaitingReview(account: Account): VisitSummary[] {
  return account.visits
    .filter((v) => v.status === "pending_review" && v.draft)
    .sort((a, b) =>
      (a.draft?.draftedAt ?? "").localeCompare(b.draft?.draftedAt ?? ""),
    );
}

/** A reviewer opened the draft: the prototype fallback waits for them. */
export function markOpened(account: Account, id: string, by: string): Account {
  account.visits = account.visits.map((v) =>
    v.id === id && v.status === "pending_review" && v.draft && !v.draft.openedAt
      ? {
          ...v,
          draft: {
            ...v.draft,
            openedBy: by,
            openedAt: new Date().toISOString(),
          },
        }
      : v,
  );
  return account;
}

/**
 * Epic 8 approval. Idempotent: once a visit is ready, a late fallback timer in
 * another tab cannot overwrite what the reviewer sent.
 */
export function approveVisit(
  account: Account,
  id: string,
  verifiedBy: string,
  plain?: string,
): Account {
  const before = account.visits.find((v) => v.id === id);
  account.visits = account.visits.map((v) => {
    if (v.id !== id || v.status === "ready") return v;
    // Legacy data (or a visit stranded mid-pipeline) may not have a draft yet.
    const d = v.draft ?? scriptedDraft(account, v);
    return {
      ...v,
      status: "ready",
      transcript: d.transcript,
      plain: plain?.trim() || d.plain,
      diagnoses: d.diagnoses,
      medicationChanges: d.medicationChanges,
      followUps: d.followUps,
      reminders: d.reminders,
      verifiedBy,
      reviewedAt: new Date().toISOString(),
      draft: undefined,
    };
  });
  if (!before || before.status === "ready") return account;
  const last = account.notifications?.[0]?.id;
  notifyFamily(
    account,
    "routine",
    before.provider === UNNAMED_DOCTOR
      ? `${account.parent.preferredName}'s visit summary is ready to read`
      : `${before.provider} visit summary is ready to read`,
  );
  // Quiet hours, or a death, change what went out. The screens read this back.
  const sent = account.notifications?.[0];
  if (sent && sent.id !== last)
    account.visits = account.visits.map((v) =>
      v.id === id ? { ...v, notificationId: sent.id } : v,
    );
  return account;
}

/**
 * doc-transcription.md Epic 3: every family open of a visit is kept. Repeat
 * opens by the same person within a minute count once.
 */
export function logVisitView(account: Account, visitId: string): Account {
  const actor = currentMember(account)?.name ?? "Unknown";
  const at = new Date().toISOString();
  const last = (account.visitAudit ?? []).find((e) => e.visitId === visitId);
  if (last?.actor === actor && Date.parse(at) - Date.parse(last.at) < 60_000)
    return account;
  account.visitAudit = [{ visitId, actor, at }, ...(account.visitAudit ?? [])];
  return account;
}

export function visitAuditFor(
  account: Account,
  visitId: string,
): VisitAuditEntry[] {
  return (account.visitAudit ?? []).filter((e) => e.visitId === visitId);
}
