import { isoDate, todayIso } from "../actions";
import { authorizedAgent, currentMember } from "../permissions";
import type { Account, VisitSummary } from "../types";
import type { Source } from "./types";

/** Same day arithmetic as the Today feed, so both screens agree on "today". */
export function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return isoDate(d);
}

export function dayLabel(date: string): string {
  if (date === todayIso()) return "Today";
  if (date === isoDaysAgo(1)) return "Yesterday";
  if (date === isoDaysAgo(-1)) return "Tomorrow";
  return new Date(date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

/** "Sep 22, 3:10 PM" for datetimes, "Sep 22" for plain dates. */
export function stamp(iso: string, timeZone?: string): string {
  if (iso.length <= 10) {
    return new Date(iso + "T12:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
  const text = new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  });
  // Match the feed: a clock time in her zone is labelled as hers.
  return timeZone ? `${text} her time` : text;
}

/** Follow-ups carry raw ISO dates ("recheck on 2026-09-26"). Make them human. */
export function humanDates(text: string): string {
  return text.replace(/\d{4}-\d{2}-\d{2}/g, (d) => dayLabel(d));
}

/** Current hour in the parent's timezone. Reminders run parent-local (MED-001). */
export function parentHourNow(timeZone: string): number {
  try {
    const h = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone,
    }).format(new Date());
    return Number(h);
  } catch {
    return new Date().getHours();
  }
}

export function firstName(name: string): string {
  return name.split(" ")[0] ?? name;
}

export function list(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** Provenance for anything taken from a doctor visit summary. */
export function visitSource(v: VisitSummary): Source {
  if (v.status === "ready" && v.verifiedBy)
    return {
      module: `Visit summary, ${v.provider}`,
      at: v.date,
      verification: "human_verified",
      by: v.verifiedBy.split(",")[0],
    };
  return {
    module: `Visit summary, ${v.provider}`,
    at: v.date,
    verification: v.status === "ready" ? "ai_generated" : "pending_review",
  };
}

export function latestVisit(account: Account): VisitSummary | undefined {
  return [...account.visits].sort((a, b) => b.date.localeCompare(a.date))[0];
}

export function primaryDoctor(account: Account): string | undefined {
  return (
    account.visits.find((v) => v.specialty === "Primary care")?.provider ??
    latestVisit(account)?.provider
  );
}

/**
 * Spec step F, "Sensitive Information? → Hide Restricted Information". A
 * read-only member gets the plain summary; the detail stays with whoever
 * holds the POA. Returns the privacy message, or undefined for full access.
 */
export function restrictedNote(account: Account): string | undefined {
  if (currentMember(account)?.accessLevel !== "read") return undefined;
  const agent = authorizedAgent(account);
  const who = agent ? firstName(agent.name) : "Her healthcare proxy";
  return `You have view access, so I'm showing the plain summary. The full record stays with ${who}. ${who} controls what's shared.`;
}

export function usd(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n % 1 ? 2 : 0,
  });
}
