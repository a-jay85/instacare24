"use client";

import { useSyncExternalStore } from "react";
import { todayIso } from "@/lib/actions";

/**
 * A ticking clock for "opened 12 min ago". The snapshot is a cached module
 * value that the interval refreshes, never a fresh Date.now() per render.
 */
let now = Date.now();
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    now = Date.now();
    timer = setInterval(() => {
      now = Date.now();
      for (const l of listeners) l();
    }, 30_000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

export function useNow(): number {
  return useSyncExternalStore(
    subscribe,
    () => now,
    () => 0,
  );
}

/** Same UTC calendar as `todayIso()`, which the seed and logCheckIn use. */
export function dayLabel(date: string): string {
  if (date === todayIso()) return "Today";
  const y = new Date();
  y.setUTCDate(y.getUTCDate() - 1);
  if (date === y.toISOString().slice(0, 10)) return "Yesterday";
  return new Date(date + "T12:00:00Z").toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

/** Clock time in a given zone, e.g. "2:22 PM". */
export function timeIn(iso: string, timeZone: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ago(iso: string, nowMs: number): string {
  const mins = Math.max(0, Math.round((nowMs - Date.parse(iso)) / 60_000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  return `${hours} h ${mins % 60} min ago`;
}
