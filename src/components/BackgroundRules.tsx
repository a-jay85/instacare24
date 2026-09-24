"use client";

import { useEffect, useState } from "react";
import {
  anyUnownedTooLong,
  assignUnowned,
  escalateMissedWindow,
  missedWindow,
} from "@/lib/actions";
import { updateCallbackRequest, useCallbackRequests } from "@/lib/callbacks";
import type { Account } from "@/lib/types";
import { useAccount } from "@/lib/store";

const CHECK_MS = 30_000;

/**
 * Rules that run on the clock, not on a click. There is no backend, so any
 * open page (family app, console or demo) checks them. It only writes when a
 * rule fires, so two open tabs don't bounce storage events back and forth.
 */
export function BackgroundRules() {
  const { account, update } = useAccount();
  const callbacks = useCallbackRequests();
  const [tick, setTick] = useState(0);

  // Re-check as her clock moves past the window's end.
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), CHECK_MS);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (account && missedWindow(account)) update(escalateMissedWindow);
  }, [account, tick, update]);

  // ESC-002: nothing stays unowned past two hours.
  useEffect(() => {
    if (account && anyUnownedTooLong(account)) update((a) => assignUnowned(a));
  }, [account, tick, update]);

  // Same rule for call-back requests made before there was an account.
  useEffect(() => {
    for (const c of callbacks)
      if (anyUnownedTooLong({ escalations: [c.esc] } as unknown as Account))
        updateCallbackRequest(c.esc.id, (a) => assignUnowned(a));
  }, [callbacks, tick]);

  return null;
}
