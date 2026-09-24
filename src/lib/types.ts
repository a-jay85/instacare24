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
  /**
   * ONB-004: named in onboarding but not signed in yet. Their timezone is a
   * copy of the subscriber's until they join.
   */
  pending?: boolean;
  /** NTF-003: how this member wants updates. Unset means the default. */
  notifyBy?: NotifyChannel;
};

/** NTF-003. SCRIPTED: nothing is really sent on any of these. */
export type NotifyChannel = "app" | "text" | "email";

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

/** The six languages in docs/sources/elderlink-prototype.md. The caller needs to know before she dials. */
export type Language = "en" | "es" | "zh" | "hi" | "vi" | "tl";

/**
 * AUT-005: whether her ability to consent is in doubt. While it is, nobody
 * records her yes; a Care Specialist decides what happens instead.
 */
export type Capacity = {
  inDoubt: boolean;
  /** Who raised or cleared it, when, and in their words. */
  by?: string;
  at?: string;
  note?: string;
};

export type ParentProfile = {
  fullName: string;
  preferredName: string;
  phone: string;
  language: Language;
  capacity: Capacity;
  /** CHK-001 / MED-001: check-ins and reminders run parent-local. */
  parentTimezone: string;
  channel: ParentChannel;
  checkInWindow: CheckInWindow;
  emergencyContact: EmergencyContact;
  normalDay: NormalDay;
  consent: Consent;
};

export type Subscription = {
  /** BIL-002: "ended" once a death is recorded. */
  status: "none" | "active" | "ended";
  endedAt?: string;
  priceMonthly: number;
  cardLast4?: string;
  startedAt?: string;
  /** BIL-003: calls and reminders are held until this date. */
  pausedUntil?: string;
};

export type QuietHours = { startHour: number; endHour: number };

/**
 * NTF-001 / NTF-002. What the family is sent. Safety goes out at once at any
 * hour; routine waits out each member's quiet hours on their own clock.
 */
export type FamilyNotification = {
  id: string;
  createdAt: string;
  kind: "safety" | "routine";
  title: string;
  /** One per member, worked out on that member's familyTimezone. */
  deliveries: {
    memberId: string;
    deliverAt: string;
    held: boolean;
    /** NTF-003: the member's channel when it was queued. */
    channel?: NotifyChannel;
  }[];
};

export type CheckInState = "reached" | "not_reached" | "something_off";

export type SummaryReply = {
  id: string;
  memberId: string;
  name: string;
  text: string;
  at: string;
};

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
  /** FEED-004: family replies to the summary, for the VA before her next call. */
  replies?: SummaryReply[];
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
  /**
   * When it was put on the list. Missing means it was there before today. A
   * dose whose hour had already passed that day starts the next day.
   */
  addedAt?: string;
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
  /** Her window closed and nobody logged a call at all (CHK-001). */
  | "missed_window"
  | "family_request"
  | "risk_score"
  | "consent_withdrawn"
  | "consent_declined"
  | "assistant"
  /** ESC-004: a medical question from Ask, for the on-call clinical reviewer. */
  | "clinical_question"
  /** AUT-005: her ability to consent is in doubt. */
  | "capacity"
  | "deceased";

export type RiskTier = "green" | "medium" | "high" | "critical";

/**
 * HITL routing (docs/sources/hitl.md). Marks a scripted "who was told" event so
 * the family card can show it without parsing staff text. Incident reports stay
 * console-only.
 */
export type EscalationNotice =
  "physician" | "family" | "emergency" | "incident";

export type EscalationEvent = {
  at: string;
  by: string;
  text: string;
  notice?: EscalationNotice;
  /** Family-facing words for a notice, e.g. "Dr. Elena Alvarez's office". */
  who?: string;
};

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
  /**
   * ESC-002: set when the 2-hour rule named the owner because nobody took it.
   * Cleared when that person confirms it. Until then nobody has really picked
   * it up, so no screen may say they have.
   */
  autoAssignedAt?: string;
  resolvedAt?: string;
  resolution?: string;
  timeline: EscalationEvent[];
};

/** Epic 7-8 flags a reviewer should look at before approving. */
export type ReviewFlag = {
  kind: "low_confidence" | "guardrail";
  title: string;
  quote: string;
  note: string;
};

/**
 * The AI draft waiting in the Human Review Queue (Epic 8). Kept apart from the
 * visit's own fields so nothing unchecked reaches the feed or the assistant.
 */
export type VisitDraft = {
  transcript: string;
  plain: string;
  diagnoses: string[];
  medicationChanges: string[];
  followUps: string[];
  reminders: string[];
  flags: ReviewFlag[];
  draftedAt: string;
  /** PROTOTYPE FALLBACK: auto-approve time if nobody approves in the console. */
  fallbackAt: string;
  /** Set when a reviewer opens it; pauses the fallback while they read. */
  openedBy?: string;
  openedAt?: string;
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
  reviewedAt?: string;
  /** The family notification sent on approval. Missing means none went out. */
  notificationId?: string;
  draft?: VisitDraft;
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
  /** ESC-004: RN or LCSW on call. Reads, and keeps advice with her doctors. */
  clinicalReviewerName: string;
};

/**
 * ONB-004 / AUT-004: family the authorized agent asked to read along. Not a
 * member until they accept, so an invite never shows up in permissions.
 */
export type Invite = {
  id: string;
  name: string;
  email: string;
  relationship: string;
  sentAt: string;
};

export type Account = {
  id: string;
  createdAt: string;
  /** Which member is "signed in" for this demo session. */
  currentMemberId: string;
  members: Member[];
  invites: Invite[];
  parent: ParentProfile;
  subscription: Subscription;
  quietHours: QuietHours;
  onboardingCompletedAt?: string;
  checkIns: CheckInRecord[];
  careTeam: CareTeam;
  medications: Medication[];
  medAcks: MedAck[];
  escalations: Escalation[];
  /** NTF-001 / NTF-002: sent, or held for quiet hours. */
  notifications: FamilyNotification[];
  visits: VisitSummary[];
  insurance?: Insurance;
  eobs: Eob[];
  /** BIL-002: once set, every automated message and check-in stops. */
  deceasedAt?: string;
};
