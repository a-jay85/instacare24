import {
  CHECK_IN,
  PARENT_CHANNEL,
  PRICE_MONTHLY,
  QUIET_HOURS_DEFAULT,
} from "./config";
import { detectFamilyTimezone } from "./timezones";
import { DEFAULT_CARE_TEAM } from "./seed";
import type { Account, Language } from "./types";

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
    /** So the caller speaks her language from the first call. */
    language: Language;
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
  /** ONB-001: when sign-up began, so the time to a scheduled check-in is measured. */
  startedAt: string;
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
      language: "en",
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
    startedAt: new Date().toISOString(),
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
          pending: true,
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
    invites: [],
    parent: {
      fullName:
        draft.parent.fullName.trim() || draft.parent.preferredName.trim(),
      preferredName: draft.parent.preferredName.trim(),
      phone: draft.parent.phone.trim(),
      // A draft saved before language existed falls back to English.
      language: draft.parent.language ?? "en",
      capacity: { inDoubt: false },
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
    onboardingStartedAt: draft.startedAt,
    onboardingCompletedAt: now,
    checkIns: [],
    careTeam: DEFAULT_CARE_TEAM,
    // MED-001 lives in the Care tab, not in onboarding. ONB-002 closes the list.
    medications: [],
    medAcks: [],
    escalations: [],
    notifications: [],
    visits: [],
    eobs: [],
  };
}

/**
 * ONB-003 (P1): a partly finished setup survives a reload, and a link carries
 * it to another device (see draftLink). The card is never written to storage
 * or put in the link: resuming on the last step simply asks for it again.
 */
const DRAFT_KEY = "instacare24:onboarding:v1";

export type SavedDraft = {
  draft: Draft;
  index: number;
  /** Set once "Start the service" saved an account, so a reload keeps the done screen. */
  doneAccountId?: string;
};

export function loadDraft(): SavedDraft | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Partial<SavedDraft>;
    const base = emptyDraft();
    const d = (saved.draft ?? {}) as Partial<Draft>;
    return {
      draft: {
        you: { ...base.you, ...d.you },
        parent: { ...base.parent, ...d.parent },
        agent: { ...base.agent, ...d.agent },
        window: { ...base.window, ...d.window },
        emergency: { ...base.emergency, ...d.emergency },
        normalDay: { ...base.normalDay, ...d.normalDay },
        payment: base.payment,
        startedAt: d.startedAt ?? base.startedAt,
      },
      index: typeof saved.index === "number" ? saved.index : 0,
      doneAccountId: saved.doneAccountId,
    };
  } catch {
    return null;
  }
}

export function saveDraft(saved: SavedDraft) {
  try {
    const { payment: _card, ...rest } = saved.draft;
    void _card;
    window.localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ ...saved, draft: rest }),
    );
  } catch {
    // Private browsing: the wizard still works, it just won't survive reload.
  }
}

/**
 * ONB-003: "finish on another device". SCRIPTED: with no account server, the
 * draft rides in the link's #fragment, which browsers never send to a server.
 * A real build would hold it server-side behind a short code. No card.
 */
const LINK_KEY = "resume";

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(code: string): string {
  const bin = atob(code.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

/** A link to this page that reopens the draft on another device. */
export function draftLink(saved: SavedDraft): string {
  const { payment: _card, ...rest } = saved.draft;
  void _card;
  const code = toBase64Url(JSON.stringify({ draft: rest, index: saved.index }));
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#${LINK_KEY}=${code}`;
}

/**
 * Opened from a draftLink: save the draft here, then drop the fragment so a
 * reload or a shared screenshot does not carry it. True if one was taken.
 */
export function takeDraftFromLink(): boolean {
  try {
    const hash = window.location.hash.slice(1);
    const code = new URLSearchParams(hash).get(LINK_KEY);
    if (!code) return false;
    const saved = JSON.parse(fromBase64Url(code)) as SavedDraft;
    window.history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search,
    );
    saveDraft({ draft: saved.draft, index: saved.index });
    return true;
  } catch {
    return false;
  }
}

export function clearDraft() {
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    // Nothing to clear.
  }
}

/** True once the family has typed anything worth offering to resume. */
export function draftHasContent(d: Draft): boolean {
  return Boolean(
    d.you.name.trim() ||
    d.you.email.trim() ||
    d.parent.preferredName.trim() ||
    d.parent.phone.trim(),
  );
}
