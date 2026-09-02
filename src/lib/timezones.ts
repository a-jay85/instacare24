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
