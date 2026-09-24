"use client";

import { useSyncExternalStore } from "react";

/**
 * One shared clock for the console, ticking once a second. Kept outside React
 * so render stays pure; the server snapshot is 0, which callers treat as
 * "not hydrated yet" and render nothing time-dependent.
 */
let current = typeof window === "undefined" ? 0 : Date.now();
let timer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    current = Date.now();
    timer = setInterval(() => {
      current = Date.now();
      for (const l of listeners) l();
    }, 1000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

export function useNow(): number {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => 0,
  );
}

/** Wall-clock hour and minute in a timezone. */
export function localClock(tz: string, now: number) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(new Date(now));
  const get = (t: string) =>
    Number(parts.find((p) => p.type === t)?.value ?? 0);
  return { hour: get("hour") % 24, minute: get("minute") };
}

export function localTimeLabel(tz: string, now: number): string {
  return new Date(now).toLocaleTimeString("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Minutes until a 2-hour window closes, parent-local. Negative once closed. */
export function minutesToClose(
  tz: string,
  startHour: number,
  now: number,
  lengthHours = 2,
): number {
  const { hour, minute } = localClock(tz, now);
  return (startHour + lengthHours) * 60 - (hour * 60 + minute);
}

/** Safe for any integer hour, unlike formatHour past 24. */
export function hourLabel(hour: number): string {
  const h24 = ((hour % 24) + 24) % 24;
  const h = ((h24 + 11) % 12) + 1;
  return `${h}:00 ${h24 < 12 ? "AM" : "PM"}`;
}

export function windowLabel(startHour: number, lengthHours = 2): string {
  return `${hourLabel(startHour)} – ${hourLabel(startHour + lengthHours)}`;
}

/** 95 -> "1h 35m", 12 -> "12m". */
export function minutesLabel(min: number): string {
  const m = Math.abs(Math.round(min));
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
}

/** 83 -> "1:23". */
export function stopwatch(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function ageMinutes(iso: string, now: number): number {
  return (now - new Date(iso).getTime()) / 60_000;
}

export function clockLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}
