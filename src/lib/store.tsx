"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { Account } from "./types";
import { SEEDS, type SeedKey } from "./seed";

const STORAGE_KEY = "instacare24:account:v1";

type Snapshot = {
  /** null means nobody has finished onboarding in this browser yet. */
  account: Account | null;
  /** False until localStorage has been read, so we never flash the wrong screen. */
  ready: boolean;
};

/**
 * A tiny module-level store rather than context state, so the localStorage read
 * happens outside React's render/effect cycle. Same shape a real API client
 * would have.
 */
const SERVER_SNAPSHOT: Snapshot = { account: null, ready: false };

let snapshot: Snapshot = SERVER_SNAPSHOT;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function setSnapshot(next: Snapshot) {
  snapshot = next;
  emit();
}

function hydrate() {
  if (hydrated) return;
  hydrated = true;
  let account: Account | null = null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) account = JSON.parse(raw) as Account;
  } catch {
    // Prototype: a corrupt blob just means we start over.
  }
  setSnapshot({ account, ready: true });
}

function persist(account: Account | null) {
  try {
    if (account) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(account));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Private browsing. The session still works, it just won't survive reload.
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  hydrate();
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return snapshot;
}

function getServerSnapshot() {
  return SERVER_SNAPSHOT;
}

/** Kept so the root layout has one obvious place to wrap the app later. */
export function AccountProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useAccount() {
  const { account, ready } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const save = useCallback((next: Account) => {
    persist(next);
    setSnapshot({ account: next, ready: true });
  }, []);

  const update = useCallback((fn: (draft: Account) => Account) => {
    if (!snapshot.account) return;
    const next = fn(structuredClone(snapshot.account));
    persist(next);
    setSnapshot({ account: next, ready: true });
  }, []);

  const loadSeed = useCallback(
    (key: SeedKey) => {
      save(SEEDS[key].build());
    },
    [save],
  );

  const clear = useCallback(() => {
    persist(null);
    setSnapshot({ account: null, ready: true });
  }, []);

  return useMemo(
    () => ({ account, ready, save, update, loadSeed, clear }),
    [account, ready, save, update, loadSeed, clear],
  );
}
