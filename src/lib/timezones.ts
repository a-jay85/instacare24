export const TIMEZONES = [
  { id: "America/New_York", label: "Eastern (New York)" },
  { id: "America/Chicago", label: "Central (Chicago)" },
  { id: "America/Denver", label: "Mountain (Denver)" },
  { id: "America/Phoenix", label: "Arizona (Phoenix)" },
  { id: "America/Los_Angeles", label: "Pacific (Los Angeles)" },
  { id: "America/Anchorage", label: "Alaska (Anchorage)" },
  { id: "Pacific/Honolulu", label: "Hawaii (Honolulu)" },
];

export function timezoneLabel(id: string): string {
  return TIMEZONES.find((t) => t.id === id)?.label ?? id;
}

export function detectFamilyTimezone(): string {
  try {
    const guess = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (TIMEZONES.some((t) => t.id === guess)) return guess;
  } catch {
    // Server render, or a browser that will not tell us. Fall through.
  }
  return "America/New_York";
}

/** 9 -> "9:00 AM". Hours only; the scope sheet never needs minutes. */
export function formatHour(hour: number): string {
  const h = ((hour + 11) % 12) + 1;
  const suffix = hour < 12 || hour === 24 ? "AM" : "PM";
  return `${h}:00 ${suffix}`;
}

export function formatWindow(startHour: number, lengthHours = 2): string {
  return `${formatHour(startHour)} – ${formatHour(startHour + lengthHours)}`;
}

/** Rough offset gap in hours between two zones, for the "3 timezones away" copy. */
export function hoursApart(a: string, b: string): number {
  const now = new Date();
  const at = new Date(now.toLocaleString("en-US", { timeZone: a }));
  const bt = new Date(now.toLocaleString("en-US", { timeZone: b }));
  return Math.round((at.getTime() - bt.getTime()) / 3_600_000);
}

/** Current hour, 0-23, on a given IANA clock. */
export function hourIn(timezone: string, at: Date = new Date()): number {
  try {
    const h = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hourCycle: "h23",
    }).format(at);
    return Number(h) % 24;
  } catch {
    return at.getHours();
  }
}

/** Calendar day as YYYY-MM-DD on a given IANA clock. */
export function dateIn(timezone: string, at: Date = new Date()): string {
  try {
    return at.toLocaleDateString("en-CA", { timeZone: timezone });
  } catch {
    return at.toLocaleDateString("en-CA");
  }
}

/**
 * "2026-09-24" + -1 -> "2026-09-23". Pure calendar math on UTC noon, so the
 * viewer's own zone and DST never move the day.
 */
export function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Minutes since midnight on a given IANA clock. */
export function minutesIn(timezone: string, at: Date = new Date()): number {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      minute: "numeric",
      hourCycle: "h23",
    }).formatToParts(at);
    const get = (t: string) =>
      Number(parts.find((p) => p.type === t)?.value ?? 0);
    return (get("hour") % 24) * 60 + get("minute");
  } catch {
    return at.getHours() * 60 + at.getMinutes();
  }
}
