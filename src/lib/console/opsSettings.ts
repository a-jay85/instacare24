import { useSyncExternalStore } from "react";
import { CHECK_IN } from "../config";

/**
 * Configurable values table: no-answer retries (1 to 3, default 2) and the gap
 * between them (10 to 60 minutes, default 20). Ops sets these for everyone on
 * this console, so they live outside any one family's account.
 */
export type OpsSettings = { retries: number; gapMinutes: number };

export const RETRY_LIMITS = { min: 1, max: 3 };
export const GAP_LIMITS = { min: 10, max: 60 };

const KEY = "instacare24:ops:v1";
const DEFAULTS: OpsSettings = {
  retries: CHECK_IN.noAnswerRetries,
  gapMinutes: CHECK_IN.retryGapMinutes,
};
const listeners = new Set<() => void>();

const clamp = (n: unknown, lo: number, hi: number, dflt: number) =>
  typeof n === "number" && Number.isFinite(n)
    ? Math.min(hi, Math.max(lo, Math.round(n)))
    : dflt;

let cacheRaw: string | null = null;
let cache: OpsSettings = DEFAULTS;

function read(): OpsSettings {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return DEFAULTS;
  }
  if (raw === cacheRaw) return cache;
  cacheRaw = raw;
  try {
    const v = raw ? (JSON.parse(raw) as Partial<OpsSettings>) : {};
    cache = {
      retries: clamp(
        v.retries,
        RETRY_LIMITS.min,
        RETRY_LIMITS.max,
        DEFAULTS.retries,
      ),
      gapMinutes: clamp(
        v.gapMinutes,
        GAP_LIMITS.min,
        GAP_LIMITS.max,
        DEFAULTS.gapMinutes,
      ),
    };
  } catch {
    cache = DEFAULTS;
  }
  return cache;
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  window.addEventListener("storage", fn);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", fn);
  };
}

export function saveOpsSettings(next: OpsSettings) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage blocked: the defaults stay in force.
  }
  listeners.forEach((fn) => fn());
}

export function useOpsSettings(): OpsSettings {
  return useSyncExternalStore(subscribe, read, () => DEFAULTS);
}
