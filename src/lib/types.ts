import type { ParentChannel } from "./config";

/**
 * AUT-002 / AUT-003. The parent's own consent is a separate event from her
 * family's consent on her behalf, so it gets its own state machine.
 */
export type ConsentState =
  "not_requested" | "pending" | "granted" | "withdrawn";

/**
 * AUT-004 is P1, but AUT-001 (P0) already needs distinct permission sets, so
 * the role lives on the member record from day one.
 */
export type AccessLevel = "write" | "read";

export type Member = {
  id: string;
  name: string;
  email: string;
  phone: string;
  relationshipToParent: string;
  /** NTF-001: quiet hours and notifications run family-local, never parent-local. */
  familyTimezone: string;
  /** Holds the card. BIL-001. */
  isPayer: boolean;
  /** POA or healthcare proxy. AUT-001. Not the same right as paying the bill. */
  isAuthorizedAgent: boolean;
  accessLevel: AccessLevel;
};

export type EmergencyContact = {
  name: string;
  phone: string;
  relationship: string;
};

/** Start hour only. The 2-hour span is fixed by the scope sheet. */
export type CheckInWindow = { startHour: number };

export type NormalDay = {
  tags: string[];
  notes: string;
};

export type Consent = {
  state: ConsentState;
  requestedAt?: string;
  decidedAt?: string;
  /** AUT-002 requires the consent to be captured on a recorded call. */
  recordingId?: string;
};

export type ParentProfile = {
  fullName: string;
  preferredName: string;
  phone: string;
  /** CHK-001 / MED-001: check-ins and reminders run parent-local. */
  parentTimezone: string;
  channel: ParentChannel;
  checkInWindow: CheckInWindow;
  emergencyContact: EmergencyContact;
  normalDay: NormalDay;
  consent: Consent;
};

export type Subscription = {
  status: "none" | "active";
  priceMonthly: number;
  cardLast4?: string;
  startedAt?: string;
};

export type QuietHours = { startHour: number; endHour: number };

export type CheckInState = "reached" | "not_reached" | "something_off";

export type CheckInRecord = {
  id: string;
  /** ISO date, parent-local calendar day. */
  date: string;
  state: CheckInState | null;
  summary: string | null;
  loggedAt: string | null;
  /** Who made the call. CHK-006 wants the same voice where rostering allows. */
  vaName?: string;
  /**
   * HITL helper score, 0-100. An aid next to the VA's structured state, never a
   * replacement for it (CHK-002). Tiers live in src/lib/risk.ts.
   */
  riskScore?: number;
};

/** MED-001 / MED-002. A list and a prompt. Not a record. */
export type MedSchedule =
  | {
      kind: "scheduled";
      /** Parent-local hours, e.g. [8, 20]. */ hours: number[];
    }
  | { kind: "as_needed" };

export type Medication = {
  id: string;
  name: string;
  dose: string;
  purpose: string;
  schedule: MedSchedule;
  instructions?: string;
};

/**
 * MED-003: whether today's reminder was acknowledged. Deliberately today only,
 * never an adherence history. As-needed meds never get one of these (MED-002).
 */
export type MedAck = {
  medId: string;
  /** ISO date, parent-local. */
  date: string;
  hour: number;
  state: "acknowledged" | "no_response" | "upcoming";
};

export type EscalationSource =
  | "something_off"
  | "no_answer"
  | "family_request"
  | "risk_score"
  | "consent_withdrawn"
  | "consent_declined"
  | "assistant"
  | "deceased";

export type RiskTier = "green" | "medium" | "high" | "critical";

export type EscalationEvent = { at: string; by: string; text: string };

/**
 * ESC-002: an open escalation is resolved, or it carries a named owner and a
 * recorded next action. There is no third state, so `owner` + `nextAction`
 * travel together.
 */
export type Escalation = {
  id: string;
  openedAt: string;
  source: EscalationSource;
  title: string;
  detail: string;
  riskScore?: number;
  tier?: RiskTier;
  owner?: string;
  nextAction?: string;
  resolvedAt?: string;
  resolution?: string;
  timeline: EscalationEvent[];
};

/** Doctor visit transcription & summary workflow (docs/sources/doc-transcription.md). */
export type VisitSummary = {
  id: string;
  date: string;
  provider: string;
  specialty: string;
  source: "audio" | "photo" | "pdf";
  status: "processing" | "pending_review" | "ready";
  transcript: string;
  plain: string;
  diagnoses: string[];
  medicationChanges: string[];
  followUps: string[];
  reminders: string[];
  /** Human verification, shown as provenance in the feed and assistant. */
  verifiedBy?: string;
};

export type Insurance = {
  carrier: string;
  plan: string;
  memberId: string;
  connectedVia: "portal" | "card_photo";
};

/** Insurance EOB workflow (docs/sources/insurance-eob.md). */
export type Eob = {
  id: string;
  date: string;
  provider: string;
  service: string;
  billed: number;
  planPaid: number;
  youOwe: number;
  status: "processed" | "denied" | "pending";
  plain: string;
  flags: string[];
};

export type CareTeam = {
  vaName: string;
  specialistName: string;
};

export type Account = {
  id: string;
  createdAt: string;
  /** Which member is "signed in" for this demo session. */
  currentMemberId: string;
  members: Member[];
  parent: ParentProfile;
  subscription: Subscription;
  quietHours: QuietHours;
  onboardingCompletedAt?: string;
  checkIns: CheckInRecord[];
  careTeam: CareTeam;
  medications: Medication[];
  medAcks: MedAck[];
  escalations: Escalation[];
  visits: VisitSummary[];
  insurance?: Insurance;
  eobs: Eob[];
  /** BIL-002: once set, every automated message and check-in stops. */
  deceasedAt?: string;
};
