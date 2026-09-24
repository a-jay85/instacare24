import {
  CHECK_IN,
  PARENT_CHANNEL,
  PRICE_MONTHLY,
  QUIET_HOURS_DEFAULT,
} from "./config";
import type {
  Account,
  CheckInRecord,
  Escalation,
  Eob,
  MedAck,
  Medication,
  VisitSummary,
} from "./types";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export const DEFAULT_CARE_TEAM = {
  vaName: "Priya Nair",
  specialistName: "Dana Brooks",
};

function at(daysBack: number, time: string): string {
  return `${daysAgo(daysBack)}T${time}:00.000Z`;
}

/**
 * Today is deliberately empty so the demo can log it live from the staff
 * console. Three days back is unchecked on purpose (FEED-002).
 */
function history(): CheckInRecord[] {
  return [
    {
      id: "c1",
      date: daysAgo(1),
      state: "not_reached",
      summary:
        "No answer at 10:05 or on the two retries after. Dana reached her at 1:40 PM: she was at the parish lunch and had left her phone at home.",
      loggedAt: at(1, "15:10"),
      vaName: "Priya Nair",
    },
    {
      id: "c2",
      date: daysAgo(2),
      state: "reached",
      summary:
        "Rosa picked up on the second ring. She had already been out for the paper and was making coffee. Said her knee is the usual, no worse. Mentioned the upstairs neighbour's dog again, cheerfully.",
      loggedAt: at(2, "14:22"),
      vaName: "Priya Nair",
      riskScore: 8,
    },
    {
      id: "c3",
      date: daysAgo(3),
      // FEED-002: a day with no completed check-in must never read as normal.
      state: null,
      summary: null,
      loggedAt: null,
    },
    {
      id: "c4",
      date: daysAgo(4),
      state: "reached",
      summary:
        "Short call, Rosa was on her way to the pharmacy. Sounded steady and in a hurry, which she said was because the bus was coming.",
      loggedAt: at(4, "14:48"),
      vaName: "Priya Nair",
      riskScore: 6,
    },
    {
      id: "c5",
      date: daysAgo(5),
      state: "reached",
      summary:
        "Talked for ten minutes about her granddaughter's recital. She is weighing herself every morning like Dr. Alvarez asked. Ankles look better, she says.",
      loggedAt: at(5, "14:30"),
      vaName: "Priya Nair",
      riskScore: 14,
    },
  ];
}

function rosaMedications(): Medication[] {
  return [
    {
      id: "med_lisinopril",
      name: "Lisinopril",
      dose: "20 mg",
      purpose: "Blood pressure",
      schedule: { kind: "scheduled", hours: [8] },
      instructions: "Raised from 10 mg by Dr. Alvarez.",
    },
    {
      id: "med_metformin",
      name: "Metformin",
      dose: "500 mg",
      purpose: "Blood sugar",
      schedule: { kind: "scheduled", hours: [8, 18] },
      instructions: "With food.",
    },
    {
      id: "med_atorvastatin",
      name: "Atorvastatin",
      dose: "20 mg",
      purpose: "Cholesterol",
      schedule: { kind: "scheduled", hours: [20] },
    },
    {
      id: "med_acetaminophen",
      name: "Acetaminophen",
      dose: "500 mg",
      purpose: "Knee pain",
      schedule: { kind: "as_needed" },
      instructions: "No more than 6 tablets a day.",
    },
  ];
}

function rosaMedAcks(): MedAck[] {
  const date = daysAgo(0);
  return [
    { medId: "med_lisinopril", date, hour: 8, state: "acknowledged" },
    { medId: "med_metformin", date, hour: 8, state: "acknowledged" },
    { medId: "med_metformin", date, hour: 18, state: "upcoming" },
    { medId: "med_atorvastatin", date, hour: 20, state: "upcoming" },
  ];
}

function rosaVisits(): VisitSummary[] {
  return [
    {
      id: "visit_alvarez",
      date: daysAgo(12),
      provider: "Dr. Elena Alvarez",
      specialty: "Primary care",
      source: "audio",
      status: "ready",
      transcript: [
        "Dr. Alvarez: How have you been feeling since the last visit?",
        "Rosa: A bit more tired than usual, and my ankles have been a little swollen.",
        "Dr. Alvarez: Your blood pressure is up. Let's raise the lisinopril to 20 milligrams and recheck in two weeks.",
        "Dr. Alvarez: Keep to the low-salt diet, and weigh yourself every morning. Call us if you gain more than three pounds in two days.",
        "Rosa: Understood. Thank you, doctor.",
      ].join("\n"),
      plain:
        "Rosa has been more tired and her ankles were a little swollen. Her blood pressure was high, so Dr. Alvarez doubled her blood pressure pill. She should weigh herself every morning and come back in two weeks.",
      diagnoses: [
        "High blood pressure, not fully controlled",
        "Mild ankle swelling",
      ],
      medicationChanges: [
        "Lisinopril raised from 10 mg to 20 mg, once each morning",
      ],
      followUps: [`Blood pressure recheck with Dr. Alvarez on ${daysAgo(-2)}`],
      reminders: [
        "Weigh every morning before breakfast",
        "Call the office if weight goes up more than 3 lb in 2 days",
        "Keep to the low-salt diet",
      ],
      verifiedBy: "Dana Brooks, Care Specialist",
    },
    {
      id: "visit_okafor",
      date: daysAgo(41),
      provider: "Dr. Samuel Okafor",
      specialty: "Orthopedics",
      source: "pdf",
      status: "ready",
      transcript:
        "Scanned after-visit summary, 2 pages. Right knee X-ray: moderate osteoarthritis, no fracture. Plan: acetaminophen as needed, physical therapy evaluation, cane for longer walks.",
      plain:
        "Rosa's right knee has wear-and-tear arthritis. Nothing is broken. She can take acetaminophen when it hurts, and the doctor wants a physical therapist to see her.",
      diagnoses: ["Osteoarthritis of the right knee"],
      medicationChanges: ["Acetaminophen 500 mg as needed for pain"],
      followUps: ["Physical therapy evaluation"],
      reminders: ["Use the cane for walks longer than the block"],
      verifiedBy: "Dana Brooks, Care Specialist",
    },
  ];
}

function rosaEobs(): Eob[] {
  return [
    {
      id: "eob_1",
      date: daysAgo(12),
      provider: "Dr. Elena Alvarez",
      service: "Office visit, established patient",
      billed: 245,
      planPaid: 225,
      youOwe: 20,
      status: "processed",
      plain: "Her plan covered the visit. She owes her usual $20 copay.",
      flags: [],
    },
    {
      id: "eob_2",
      date: daysAgo(41),
      provider: "Bay Ridge Orthopedics",
      service: "Knee X-ray, 3 views",
      billed: 180,
      planPaid: 132,
      youOwe: 48,
      status: "processed",
      plain:
        "Covered after her deductible. The $48 is her share, and it matches what the plan allows.",
      flags: [],
    },
    {
      id: "eob_3",
      date: daysAgo(30),
      provider: "Stride Physical Therapy",
      service: "Physical therapy evaluation",
      billed: 210,
      planPaid: 0,
      youOwe: 210,
      status: "denied",
      plain:
        "The plan said no because nobody asked it for approval first. That is usually fixable: the doctor's office can send the approval late and the claim can be appealed.",
      flags: ["Prior authorization missing", "Appeal window: 60 days"],
    },
  ];
}

function rosaEscalations(): Escalation[] {
  return [
    {
      id: "esc_seed_1",
      openedAt: at(1, "15:10"),
      source: "no_answer",
      title: "Rosa did not answer",
      detail: "No answer at 10:05, 10:25 or 10:45.",
      owner: "Dana Brooks",
      nextAction:
        "Call her emergency contact if she is still unreachable by 2 PM.",
      resolvedAt: at(1, "17:42"),
      resolution:
        "Reached her at 1:40 PM. She was at the parish lunch without her phone.",
      timeline: [
        { at: at(1, "15:10"), by: "Priya Nair", text: "Opened" },
        {
          at: at(1, "15:14"),
          by: "Dana Brooks",
          text: "Took ownership. Next: call her emergency contact if she is still unreachable by 2 PM.",
        },
        {
          at: at(1, "17:42"),
          by: "Dana Brooks",
          text: "Resolved: reached her at 1:40 PM. She was at the parish lunch without her phone.",
        },
      ],
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
        tags: [
          "Up early",
          "Lives alone",
          "Watches the news",
          "Hard of hearing",
        ],
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
    careTeam: DEFAULT_CARE_TEAM,
    medications: [],
    medAcks: [],
    escalations: [],
    visits: [],
    eobs: [],
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
        requestedAt: daysAgo(60) + "T15:00:00.000Z",
        decidedAt: daysAgo(60) + "T15:11:00.000Z",
        recordingId: "rec_8f21c4",
      },
    },
    subscription: {
      status: "active",
      priceMonthly: PRICE_MONTHLY,
      cardLast4: "1881",
      startedAt: daysAgo(60) + "T14:40:00.000Z",
    },
    quietHours: {
      startHour: QUIET_HOURS_DEFAULT.startHour,
      endHour: QUIET_HOURS_DEFAULT.endHour,
    },
    onboardingCompletedAt: daysAgo(60) + "T14:55:00.000Z",
    checkIns: history(),
    careTeam: DEFAULT_CARE_TEAM,
    medications: rosaMedications(),
    medAcks: rosaMedAcks(),
    escalations: rosaEscalations(),
    visits: rosaVisits(),
    insurance: {
      carrier: "Blue Cross Blue Shield",
      plan: "Medicare Advantage PPO",
      memberId: "BCBS-88213",
      connectedVia: "portal",
    },
    eobs: rosaEobs(),
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
