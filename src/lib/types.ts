import type { ParentChannel } from "./config";

/**
 * AUT-002 / AUT-003. The parent's own consent is a separate event from her
 * family's consent on her behalf, so it gets its own state machine.
 */
export type ConsentState =
  | "not_requested"
  | "pending"
  | "granted"
  | "withdrawn";

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
  /** Seeded only, so the feed has something to show. Not this section's scope. */
  checkIns: CheckInRecord[];
};
