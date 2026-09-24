import { NOTIFY_CHANNEL_DEFAULT, QUIET_HOURS_MIN_LENGTH } from "./config";
import { minutesIn } from "./timezones";
import type {
  Account,
  FamilyNotification,
  Member,
  NotifyChannel,
  QuietHours,
} from "./types";

/** NTF-003: the member's own choice, or the default. */
export function channelOf(m: Member): NotifyChannel {
  return m.notifyBy ?? NOTIFY_CHANNEL_DEFAULT;
}

/**
 * NTF-001 / NTF-002. SCRIPTED: nothing is really sent. Each notification
 * records when it reaches each member, so the app can say "sent" or "held
 * until 7:00 AM your time" truthfully.
 */

/** Hours covered, wrapping midnight: 21 -> 7 is 10. */
export function quietLength({ startHour, endHour }: QuietHours): number {
  return (endHour - startHour + 24) % 24;
}

/** Why these quiet hours are not allowed, or null if they are. */
export function quietHoursProblem(q: QuietHours): string | null {
  if (q.startHour === q.endHour) return "Pick two different times.";
  if (quietLength(q) < QUIET_HOURS_MIN_LENGTH)
    return `Quiet hours need to cover at least ${QUIET_HOURS_MIN_LENGTH} hours.`;
  return null;
}

/**
 * Minutes until quiet hours end on this clock, or 0 when they are not on.
 * Seconds are ignored, so a held message lands on the hour.
 */
function minutesHeld(q: QuietHours, timezone: string, at: Date): number {
  const now = minutesIn(timezone, at);
  const start = q.startHour * 60;
  const end = q.endHour * 60;
  const inside =
    start < end ? now >= start && now < end : now >= start || now < end;
  return inside ? (end - now + 1440) % 1440 : 0;
}

let seq = 0;

/**
 * Queue a notification for everyone on the account. Safety alerts ignore
 * quiet hours (NTF-002). BIL-002: after a death nothing automated goes out.
 */
export function notifyFamily(
  account: Account,
  kind: FamilyNotification["kind"],
  title: string,
  at: Date = new Date(),
): Account {
  if (account.deceasedAt) return account;
  // Roster calls run through a bare shell with no members to tell.
  const members = account.members ?? [];
  if (!members.length) return account;
  seq += 1;
  const n: FamilyNotification = {
    id: `ntf_${at.getTime().toString(36)}_${seq}`,
    createdAt: at.toISOString(),
    kind,
    title,
    deliveries: members.map((m) => {
      const wait =
        kind === "safety"
          ? 0
          : minutesHeld(account.quietHours, m.familyTimezone, at);
      return {
        memberId: m.id,
        deliverAt: new Date(at.getTime() + wait * 60_000).toISOString(),
        held: wait > 0,
        channel: channelOf(m),
      };
    }),
  };
  account.notifications = [n, ...(account.notifications ?? [])];
  return account;
}

/** What one member has been sent or is still waiting on, newest first. */
export function notificationsFor(account: Account, memberId: string) {
  return (account.notifications ?? []).flatMap((n) => {
    const d = n.deliveries.find((x) => x.memberId === memberId);
    return d ? [{ ...n, delivery: d }] : [];
  });
}

/** The notice that went with an approved visit, if any went out. */
export function visitNotification(
  account: Account,
  notificationId: string | undefined,
): FamilyNotification | undefined {
  if (!notificationId) return undefined;
  return (account.notifications ?? []).find((n) => n.id === notificationId);
}
