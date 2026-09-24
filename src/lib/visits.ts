import type { VisitSummary } from "./types";

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
    const label = ext ? `a .${ext} file` : "a file type we can't recognise";
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
      title: "Reading the words",
      detail:
        source === "audio"
          ? "Turning the conversation into text and telling the voices apart."
          : "Reading the page (OCR), line by line.",
    },
    {
      title: "Pulling her records from the patient portal",
      detail: "Filling gaps from the doctor's own notes.",
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

/** A new visit as it lands: no summary yet, so nothing unchecked leaks elsewhere. */
export function blankVisit(input: {
  id: string;
  date: string;
  source: VisitSource;
}): VisitSummary {
  return {
    ...input,
    provider: "Dr. Marcus Lee",
    specialty: "Cardiology",
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
 * SCRIPTED sample output, standing in for speech-to-text/OCR + summariser.
 * It reports what the doctor said. It does not interpret (workflow Epic 5).
 */
export function scriptedSummary(
  visit: VisitSummary,
  name: string,
  verifiedBy: string,
  seconds?: number,
): VisitSummary {
  const followUp = inDays(visit.date, 90);
  const transcript =
    visit.source === "audio"
      ? [
          `Recorded in the exam room${seconds ? `, ${Math.max(1, Math.round(seconds / 60))} min` : ""}. Speakers identified: Dr. Lee, ${name}.`,
          "",
          `Dr. Lee: ${name}, I've looked at your echocardiogram from last week.`,
          "Dr. Lee: The heart ultrasound looks normal. The pumping is good and the valves are working well.",
          `${name}: So the tiredness isn't my heart?`,
          "Dr. Lee: Nothing on this test points to your heart. Dr. Alvarez is watching your blood pressure, and the lisinopril is doing its job.",
          "Dr. Lee: Stay on the lisinopril, 20 milligrams each morning. No changes today.",
          "Dr. Lee: Keep weighing yourself in the mornings. I'd like to see you again in three months.",
          `${name}: Three months. All right. Thank you.`,
        ].join("\n")
      : [
          `${visit.source === "pdf" ? "PDF" : "Photo of"} after-visit summary, 1 page. Read with OCR; confidence high.`,
          "",
          "Cardiology follow-up, Dr. Marcus Lee.",
          "Echocardiogram: normal left ventricular size and function. No significant valve disease.",
          "Medications: continue lisinopril 20 mg daily. No changes.",
          "Plan: daily morning weights. Return to clinic in 3 months.",
        ].join("\n");

  return {
    ...visit,
    status: "ready",
    transcript,
    plain: `Dr. Lee said ${name}'s heart ultrasound looked normal: her heart is pumping well and the valves are working. Nothing changes with her medicines. He wants to see her again in three months.`,
    diagnoses: [
      "No new diagnosis. Dr. Lee said the heart ultrasound (echocardiogram) was normal.",
    ],
    medicationChanges: [
      "No change. Keep taking lisinopril 20 mg each morning.",
    ],
    followUps: [`Cardiology follow-up with Dr. Lee around ${followUp}`],
    reminders: [
      "Book the three-month visit with Dr. Lee's office",
      "Keep weighing every morning before breakfast",
      "Bring her medication list to the next visit",
    ],
    verifiedBy,
  };
}
