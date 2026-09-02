import { CHECK_IN, PARENT_CHANNEL, PRICE_MONTHLY, QUIET_HOURS_DEFAULT } from "./config";
import { detectFamilyTimezone } from "./timezones";
import type { Account } from "./types";

/**
 * ONB-002 closes the field list: parent name, contact, timezone, check-in
 * window, one emergency contact, and what a normal day looks like. Anything
 * added here must be consumed by the check-in, the feed or an escalation.
 *
 * The two additions below both earn their place from other P0s:
 *   - the authorized agent, from AUT-001
 *   - the card, from BIL-001
 */
export type Draft = {
  you: {
    name: string;
    email: string;
    phone: string;
    relationshipToParent: string;
    familyTimezone: string;
  };
  parent: {
    preferredName: string;
    fullName: string;
    phone: string;
    parentTimezone: string;
  };
  agent: {
    /** null until answered, so we can require a choice. */
    iAmTheAgent: boolean | null;
    name: string;
    email: string;
    phone: string;
    relationshipToParent: string;
  };
  window: { startHour: number };
  emergency: { name: string; phone: string; relationship: string };
  normalDay: { tags: string[]; notes: string };
  payment: { cardNumber: string; expiry: string; cvc: string; zip: string };
};

export function emptyDraft(): Draft {
  return {
    you: {
      name: "",
      email: "",
      phone: "",
      relationshipToParent: "Daughter",
      familyTimezone: detectFamilyTimezone(),
    },
    parent: {
      preferredName: "",
      fullName: "",
      phone: "",
      parentTimezone: detectFamilyTimezone(),
    },
    agent: {
      iAmTheAgent: null,
      name: "",
      email: "",
      phone: "",
      relationshipToParent: "Daughter",
    },
    window: { startHour: CHECK_IN.defaultStartHour },
    emergency: { name: "", phone: "", relationship: "" },
    normalDay: { tags: [], notes: "" },
    payment: { cardNumber: "", expiry: "", cvc: "", zip: "" },
  };
}

export const RELATIONSHIPS = [
  "Daughter",
  "Son",
  "Stepdaughter",
  "Stepson",
  "Niece",
  "Nephew",
  "Spouse",
  "Other family",
  "Friend",
].map((r) => ({ id: r, label: r }));

export const NORMAL_DAY_TAGS = [
  "Up early",
  "Up late",
  "Lives alone",
  "Lives with a spouse",
  "Has a caregiver visit",
  "Hard of hearing",
  "Uses a cane or walker",
  "Still drives",
  "Doesn't drive",
  "Goes out daily",
  "Rarely leaves home",
  "Naps in the afternoon",
  "Doesn't like the phone",
  "Will say she's fine either way",
];

function last4(cardNumber: string): string {
  return cardNumber.replace(/\D/g, "").slice(-4) || "0000";
}

export function draftToAccount(draft: Draft): Account {
  const now = new Date().toISOString();
  const separateAgent = draft.agent.iAmTheAgent === false;

  const you = {
    id: "m_you",
    name: draft.you.name.trim(),
    email: draft.you.email.trim(),
    phone: draft.you.phone.trim(),
    relationshipToParent: draft.you.relationshipToParent,
    familyTimezone: draft.you.familyTimezone,
    isPayer: true,
    isAuthorizedAgent: !separateAgent,
    // AUT-001: the payer alone cannot change care instructions. If someone else
    // holds the proxy, the subscriber drops to read.
    accessLevel: separateAgent ? ("read" as const) : ("write" as const),
  };

  const members = separateAgent
    ? [
        you,
        {
          id: "m_agent",
          name: draft.agent.name.trim(),
          email: draft.agent.email.trim(),
          phone: draft.agent.phone.trim(),
          relationshipToParent: draft.agent.relationshipToParent,
          // We do not know their timezone yet. Their own quiet hours get set
          // when they accept the invitation.
          familyTimezone: draft.you.familyTimezone,
          isPayer: false,
          isAuthorizedAgent: true,
          accessLevel: "write" as const,
        },
      ]
    : [you];

  return {
    id: `acct_${Math.random().toString(36).slice(2, 9)}`,
    createdAt: now,
    currentMemberId: you.id,
    members,
    parent: {
      fullName: draft.parent.fullName.trim() || draft.parent.preferredName.trim(),
      preferredName: draft.parent.preferredName.trim(),
      phone: draft.parent.phone.trim(),
      parentTimezone: draft.parent.parentTimezone,
      channel: PARENT_CHANNEL,
      checkInWindow: { startHour: draft.window.startHour },
      emergencyContact: { ...draft.emergency },
      normalDay: { ...draft.normalDay },
      // AUT-002: the family finishing setup does not consent for the parent.
      // The schedule exists; delivery waits on her own recorded yes.
      consent: { state: "pending", requestedAt: now },
    },
    subscription: {
      status: "active",
      priceMonthly: PRICE_MONTHLY,
      cardLast4: last4(draft.payment.cardNumber),
      startedAt: now,
    },
    quietHours: {
      startHour: QUIET_HOURS_DEFAULT.startHour,
      endHour: QUIET_HOURS_DEFAULT.endHour,
    },
    onboardingCompletedAt: now,
    checkIns: [],
  };
}
