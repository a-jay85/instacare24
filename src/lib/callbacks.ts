"use client";

import { useSyncExternalStore } from "react";
import type { ConsoleEscalation } from "./console/synthetic";
import type { Account } from "./types";

const STORAGE_KEY = "instacare24:callbacks:v1";

/**
 * ESC-001 before there is an account: the landing page and the sign-up wizard
 * still reach a person. There is no account to hang an escalation on, so the
 * request lives in its own list and the staff console reads it next to the
 * family escalations. Same shape as a console row, so the same take and
 * resolve actions run on it.
 */
export type CallbackRequest = ConsoleEscalation & { phone: string };

const EMPTY: CallbackRequest[] = [];
let cache: { raw: string | null; list: CallbackRequest[] } = {
  raw: null,
  list: EMPTY,
};
const listeners = new Set<() => void>();

function read(): CallbackRequest[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Private browsing: nothing saved.
  }
  if (raw === cache.raw) return cache.list;
  let list = EMPTY;
  try {
    if (raw) list = JSON.parse(raw) as CallbackRequest[];
  } catch {
    // A corrupt blob just means an empty list.
  }
  cache = { raw, list };
  return list;
}

function write(list: CallbackRequest[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Private browsing. The request still shows in this tab.
  }
  cache = { raw: JSON.stringify(list), list };
  for (const l of listeners) l();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // The console is usually open in another tab.
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useCallbackRequests(): CallbackRequest[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function requestCallbackWithoutAccount(input: {
  name: string;
  phone: string;
  note: string;
}): void {
  const now = new Date().toISOString();
  const request: CallbackRequest = {
    parentName: "No account yet",
    live: false,
    phone: input.phone,
    esc: {
      id: `esc_cb_${Math.random().toString(36).slice(2, 9)}`,
      openedAt: now,
      source: "family_request",
      title: `${input.name} asked to talk to someone`,
      detail: `No account yet. Call back on ${input.phone}.${input.note ? ` ${input.note}` : ""}`,
      timeline: [{ at: now, by: input.name, text: "Opened" }],
    },
  };
  write([request, ...read()]);
}

/** Runs a shared escalation action on one saved request. */
export function updateCallbackRequest(
  id: string,
  fn: (a: Account) => Account,
): void {
  write(
    read().map((r) => {
      if (r.esc.id !== id) return r;
      const shell = { escalations: [r.esc] } as unknown as Account;
      return { ...r, esc: fn(shell).escalations[0] };
    }),
  );
}
