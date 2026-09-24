import { dateIn, shiftDate } from "@/lib/timezones";
import type { CheckInRecord, CheckInState } from "@/lib/types";
import type { CallSubject } from "./subject";
import { localClock } from "./time";

/**
 * Synthetic roster for the VA's shift. None of this is persisted; it exists so
 * the queue looks like a real day around the one live family. Windows are set
 * relative to "now" in each parent's timezone so the demo always has one call
 * overdue, one closing soon and one already done, whenever it is run.
 */

/** Her calendar day, n days back. */
function isoDaysAgo(n: number, now: number, tz: string): string {
  return shiftDate(dateIn(tz, new Date(now)), -n);
}

export function minsAgo(n: number, now: number): string {
  return new Date(now - n * 60_000).toISOString();
}

function rec(
  now: number,
  tz: string,
  daysBack: number,
  state: CheckInState | null,
  summary: string | null,
  vaName = "Priya Nair",
): CheckInRecord {
  return {
    id: `r_${daysBack}_${Math.abs((summary ?? "x").length * 7 + daysBack)}`,
    date: isoDaysAgo(daysBack, now, tz),
    state,
    summary,
    loggedAt: state ? minsAgo(daysBack * 1440 - 30, now) : null,
    vaName: state ? vaName : undefined,
  };
}

type Seed = Omit<
  CallSubject,
  "live" | "windowStart" | "history" | "today" | "openEscalations"
> & {
  /** Window start relative to the parent's current local hour. */
  offset: number;
  history: (now: number, tz: string) => CheckInRecord[];
  today?: (now: number, tz: string) => CheckInRecord;
};

const SEEDS: Seed[] = [
  {
    key: "r_nell",
    fullName: "Helen Jennings",
    preferredName: "Nell",
    phone: "(602) 555-0181",
    tz: "America/Phoenix",
    offset: -2,
    familyName: "Susan",
    specialistName: "Dana Brooks",
    normalDay: {
      tags: ["Retired machinist", "Lives alone", "Hard of hearing"],
      notes:
        "Let it ring at least ten times. She keeps the phone in the garage. Talks about the Diamondbacks if you let her.",
    },
    meds: [
      {
        name: "Amlodipine",
        dose: "5 mg",
        purpose: "Blood pressure",
        when: "8:00 AM",
        today: "8:00 AM confirmed",
      },
    ],
    emergencyContact: {
      name: "Lou Ortega",
      phone: "(602) 555-0144",
      relationship: "Neighbor",
    },
    history: (now, tz) => [
      rec(
        now,
        tz,
        1,
        "reached",
        "In the garage, fixing a lamp for the neighbor. Sounded well.",
      ),
      rec(
        now,
        tz,
        2,
        "reached",
        "Short call. Said the heat is keeping her inside.",
      ),
      rec(
        now,
        tz,
        3,
        "not_reached",
        "No answer on three tries. Susan confirmed she was at the VA clinic.",
      ),
    ],
  },
  {
    key: "r_bea",
    fullName: "Beatrice Okonkwo",
    preferredName: "Bea",
    phone: "(773) 555-0139",
    tz: "America/Chicago",
    offset: -1,
    familyName: "Chidi and Ada",
    specialistName: "Dana Brooks",
    normalDay: {
      tags: ["Church on Sundays", "Gardens", "Uses a walker"],
      notes:
        "Mornings are her best time. She calls everyone 'my dear'. Do not rush her off the phone.",
    },
    meds: [
      {
        name: "Metformin",
        dose: "500 mg",
        purpose: "Blood sugar",
        when: "8:00 AM, 6:00 PM",
        today: "8:00 AM confirmed · 6:00 PM upcoming",
      },
      {
        name: "Furosemide",
        dose: "20 mg",
        purpose: "Fluid",
        when: "9:00 AM",
        today: "9:00 AM confirmed",
      },
    ],
    emergencyContact: {
      name: "Grace Adeyemi",
      phone: "(773) 555-0170",
      relationship: "Friend from church",
    },
    history: (now, tz) => [
      rec(
        now,
        tz,
        1,
        "something_off",
        "Said her ankles were more swollen than usual. Dana called Dr. Price's office.",
      ),
      rec(now, tz, 2, "reached", "Tomatoes are in. Sounded bright."),
      rec(
        now,
        tz,
        3,
        "reached",
        "Tired after choir practice, otherwise herself.",
      ),
    ],
  },
  {
    key: "r_soonja",
    fullName: "Soon-ja Kim",
    preferredName: "Soon-ja",
    phone: "(213) 555-0107",
    tz: "America/Los_Angeles",
    offset: 0,
    familyName: "Grace",
    specialistName: "Dana Brooks",
    normalDay: {
      tags: ["Widowed this spring", "Walks daily", "Prefers Korean"],
      notes:
        "Still grieving her husband, Jae-ho. Let her talk about him. Morning walk around the lake until about 10.",
    },
    meds: [],
    emergencyContact: {
      name: "Grace Kim",
      phone: "(206) 555-0162",
      relationship: "Daughter",
    },
    history: (now, tz) => [
      rec(now, tz, 1, "reached", "Walked the lake. Quiet, but ate breakfast."),
      rec(
        now,
        tz,
        2,
        "reached",
        "Talked about Jae-ho's garden. She is keeping it up.",
      ),
      rec(now, tz, 3, null, null),
    ],
  },
  {
    key: "r_evie",
    fullName: "Evelyn Park",
    preferredName: "Evie",
    phone: "(303) 555-0115",
    tz: "America/Denver",
    offset: 1,
    familyName: "Tom",
    specialistName: "Dana Brooks",
    normalDay: {
      tags: ["Former teacher", "Bridge on Tuesdays", "Sharp"],
      notes:
        "Will correct your grammar. Enjoys it. Keep it short on bridge days.",
    },
    meds: [
      {
        name: "Levothyroxine",
        dose: "50 mcg",
        purpose: "Thyroid",
        when: "7:00 AM",
        today: "7:00 AM confirmed",
      },
    ],
    emergencyContact: {
      name: "Tom Park",
      phone: "(720) 555-0188",
      relationship: "Son",
    },
    history: (now, tz) => [
      rec(now, tz, 1, "reached", "Won at bridge. Very pleased."),
      rec(now, tz, 2, "reached", "Asked about her new neighbor's cat."),
      rec(now, tz, 3, "reached", "Sounded well. Short call."),
    ],
  },
  {
    key: "r_fran",
    fullName: "Frances Duarte",
    preferredName: "Fran",
    phone: "(808) 555-0122",
    tz: "Pacific/Honolulu",
    offset: 2,
    familyName: "Maria",
    specialistName: "Dana Brooks",
    normalDay: {
      tags: ["Lives with a cat", "Early riser", "Mild memory loss"],
      notes:
        "Repeats questions. Answer them again, kindly, every time. The cat is called Poi.",
    },
    meds: [
      {
        name: "Donepezil",
        dose: "5 mg",
        purpose: "Memory",
        when: "8:00 PM",
        today: "8:00 PM upcoming",
      },
    ],
    emergencyContact: {
      name: "Maria Duarte",
      phone: "(503) 555-0131",
      relationship: "Daughter",
    },
    history: (now, tz) => [
      rec(
        now,
        tz,
        1,
        "reached",
        "Asked twice what day it was. Otherwise cheerful, fed Poi.",
      ),
      rec(now, tz, 2, "reached", "Sounded well."),
      rec(now, tz, 3, "reached", "Neighbor brought soup. She liked that."),
    ],
  },
  {
    key: "r_dot",
    fullName: "Dorothy Abernathy",
    preferredName: "Dot",
    phone: "(914) 555-0196",
    tz: "America/New_York",
    offset: -1,
    familyName: "Linda",
    specialistName: "Dana Brooks",
    normalDay: {
      tags: ["Navy nurse, retired", "Crossword", "Lives alone"],
      notes:
        "Calls you 'dear'. Wants the call done by the time the news starts.",
    },
    meds: [],
    emergencyContact: {
      name: "Linda Abernathy",
      phone: "(914) 555-0150",
      relationship: "Daughter",
    },
    history: (now, tz) => [
      rec(
        now,
        tz,
        1,
        "reached",
        "Finished the crossword in pen. Sounded well.",
      ),
      rec(now, tz, 2, "reached", "Short call before the news."),
      rec(now, tz, 3, "reached", "Sounded well."),
    ],
    today: (now, tz) => ({
      ...rec(
        now,
        tz,
        0,
        "reached",
        "Picked up on the first ring. Doing the crossword, sounded like herself.",
      ),
      loggedAt: minsAgo(34, now),
    }),
  },
];

export function buildRoster(now: number): CallSubject[] {
  return SEEDS.map(({ offset, history, today, ...s }) => {
    const hour = localClock(s.tz, now).hour;
    return {
      ...s,
      live: false,
      windowStart: Math.min(22, Math.max(0, hour + offset)),
      history: history(now, s.tz),
      today: today ? today(now, s.tz) : null,
      openEscalations: [],
    };
  });
}
