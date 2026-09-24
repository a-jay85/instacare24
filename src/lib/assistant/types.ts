/**
 * The Family AI Assistant's reply shape. Data only (no functions, no JSX) so a
 * whole conversation can sit in sessionStorage and be restored as-is.
 *
 * There is no model behind any of this: replies are scripted from the live
 * Account by the rules in intents.ts / answers*.ts / guardrails.ts.
 */

export type Intent =
  | "emergency"
  | "guardrail"
  | "status"
  | "checkins"
  | "med_purpose"
  | "med_today"
  | "meds"
  | "appointments"
  | "visit"
  | "transcript"
  | "insurance_owe"
  | "insurance_denied"
  | "insurance"
  | "care_team"
  | "escalations"
  | "notifications"
  | "documents"
  | "activity"
  | "talk"
  | "consent"
  | "help"
  | "fallback";

export type ReplyTone = "default" | "guardrail" | "emergency";

/** Spec "Validate Retrieved Data": source system, timestamp, who vouches for it. */
export type Verification =
  "human_verified" | "ai_generated" | "pending_review" | "record";

export type Source = {
  module: string;
  /** ISO date or datetime. */
  at?: string;
  verification: Verification;
  /** e.g. "Dana Brooks" for human_verified. */
  by?: string;
};

export type ReplyAction =
  | { kind: "link"; label: string; href: string }
  | { kind: "tel"; label: string; href: string }
  | { kind: "callback"; label: string; note: string }
  | {
      kind: "escalate";
      label: string;
      title: string;
      detail: string;
      riskScore?: number;
      /** ESC-004: a medical question, for the clinical reviewer. */
      clinical?: boolean;
      /** Confirmation bubble shown once the escalation is open. */
      confirm: string;
    };

export type Reply = {
  intent: Intent;
  tone: ReplyTone;
  /** Paragraphs. */
  body: string[];
  items?: string[];
  /** Spec "Hide Restricted Information · Display Privacy Message". */
  privacy?: string;
  sources?: Source[];
  actions?: ReplyAction[];
  /** Follow-up prompt chips; tapping one sends it. */
  suggestions?: string[];
};
