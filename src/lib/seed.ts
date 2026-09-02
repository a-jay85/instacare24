import { CHECK_IN, PARENT_CHANNEL, PRICE_MONTHLY, QUIET_HOURS_DEFAULT } from "./config";
import type { Account, CheckInRecord } from "./types";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function history(): CheckInRecord[] {
  return [
    {
      id: "c1",
      date: daysAgo(0),
      state: "reached",
      summary:
        "Rosa picked up on the second ring. She had already been out for the paper and was making coffee. Said her knee is the usual, no worse. Mentioned the upstairs neighbour's dog again, cheerfully.",
      loggedAt: new Date().toISOString(),
    },
    {
      id: "c2",
      date: daysAgo(1),
      // FEED-002: a day with no completed check-in must never read as normal.
      state: null,
      summary: null,
      loggedAt: null,
    },
    {
      id: "c3",
      date: daysAgo(2),
      state: "reached",
      summary:
        "Short call, Rosa was on her way to the pharmacy. Sounded steady and in a hurry, which she said was because the bus was coming.",
      loggedAt: new Date().toISOString(),
    },
  ];
}

/** Scenario A: the buyer is also the POA. The common case. Consent still pending. */
export function seedKaren(): Account {
  return {
    id: "acct_karen",
    createdAt: new Date().toISOString(),
    currentMemberId: "m_karen",
    members: [
      {
        id: "m_karen",
        name: "Karen Whitfield",
        email: "karen.whitfield@example.com",
        phone: "(617) 555-0148",
        relationshipToParent: "Daughter",
        familyTimezone: "America/New_York",
        isPayer: true,
        isAuthorizedAgent: true,
        accessLevel: "write",
      },
    ],
    parent: {
      fullName: "Margaret Whitfield",
      preferredName: "Margaret",
      phone: "(312) 555-0192",
      parentTimezone: "America/Chicago",
      channel: PARENT_CHANNEL,
      checkInWindow: { startHour: CHECK_IN.defaultStartHour },
      emergencyContact: {
        name: "Dale Whitfield",
        phone: "(312) 555-0110",
        relationship: "Neighbour",
      },
      normalDay: {
        tags: ["Up early", "Lives alone", "Watches the news", "Hard of hearing"],
        notes:
          "She is up by six and does the crossword. If she doesn't pick up before nine she is usually in the shower. She will say she is fine even when she isn't.",
      },
      consent: {
        state: "pending",
        requestedAt: new Date().toISOString(),
      },
    },
    subscription: {
      status: "active",
      priceMonthly: PRICE_MONTHLY,
      cardLast4: "4242",
      startedAt: new Date().toISOString(),
    },
    quietHours: {
      startHour: QUIET_HOURS_DEFAULT.startHour,
      endHour: QUIET_HOURS_DEFAULT.endHour,
    },
    onboardingCompletedAt: new Date().toISOString(),
    checkIns: [],
  };
}

/**
 * Scenario B: the buyer is NOT the POA, and the family is three timezones from
 * the parent. Exercises AUT-001 (payer cannot change care instructions) and
 * NTF-001 (quiet hours run family-local).
 */
export function seedMichael(): Account {
  return {
    id: "acct_reyes",
    createdAt: new Date().toISOString(),
    currentMemberId: "m_michael",
    members: [
      {
        id: "m_michael",
        name: "Michael Reyes",
        email: "michael.reyes@example.com",
        phone: "(415) 555-0173",
        relationshipToParent: "Son",
        familyTimezone: "America/Los_Angeles",
        isPayer: true,
        isAuthorizedAgent: false,
        accessLevel: "read",
      },
      {
        id: "m_denise",
        name: "Denise Reyes-Okonjo",
        email: "denise.ro@example.com",
        phone: "(718) 555-0126",
        relationshipToParent: "Daughter",
        familyTimezone: "America/New_York",
        isPayer: false,
        isAuthorizedAgent: true,
        accessLevel: "write",
      },
    ],
    parent: {
      fullName: "Rosa Reyes",
      preferredName: "Rosa",
      phone: "(718) 555-0104",
      parentTimezone: "America/New_York",
      channel: PARENT_CHANNEL,
      checkInWindow: { startHour: 10 },
      emergencyContact: {
        name: "Father Emmanuel Diaz",
        phone: "(718) 555-0155",
        relationship: "Parish priest",
      },
      normalDay: {
        tags: ["Lives alone", "Goes out daily", "Uses a cane"],
        notes:
          "Mass on Sunday and most Wednesdays. Walks to the pharmacy herself. She is proud about it, so don't offer help she didn't ask for.",
      },
      consent: {
        state: "granted",
        requestedAt: daysAgo(9) + "T15:00:00.000Z",
        decidedAt: daysAgo(9) + "T15:11:00.000Z",
        recordingId: "rec_8f21c4",
      },
    },
    subscription: {
      status: "active",
      priceMonthly: PRICE_MONTHLY,
      cardLast4: "1881",
      startedAt: daysAgo(9) + "T14:40:00.000Z",
    },
    quietHours: {
      startHour: QUIET_HOURS_DEFAULT.startHour,
      endHour: QUIET_HOURS_DEFAULT.endHour,
    },
    onboardingCompletedAt: daysAgo(9) + "T14:55:00.000Z",
    checkIns: history(),
  };
}

export const SEEDS = {
  karen: {
    key: "karen" as const,
    title: "Karen — pays and decides",
    blurb:
      "The common case. Karen is her mother's healthcare proxy as well as the subscriber, so she can change anything. Margaret has not consented yet, so nothing is running.",
    build: seedKaren,
  },
  michael: {
    key: "michael" as const,
    title: "Michael — pays, his sister decides",
    blurb:
      "Michael's card is on the account but his sister Denise is their mother's POA. Care instructions are read-only for him. He is also three timezones from Rosa.",
    build: seedMichael,
  },
};

export type SeedKey = keyof typeof SEEDS;
