"use client";

import { useEffect, useState } from "react";
import { escalateMissedWindow, missedWindow } from "@/lib/actions";
import { useAccount } from "@/lib/store";

const CHECK_MS = 30_000;

/**
 * Rules that run on the clock, not on a click. There is no backend, so any
 * open page (family app, console or demo) checks them. It only writes when a
 * rule fires, so two open tabs don't bounce storage events back and forth.
 */
export function BackgroundRules() {
  const { account, update } = useAccount();
  const [tick, setTick] = useState(0);

  // Re-check as her clock moves past the window's end.
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), CHECK_MS);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (account && missedWindow(account)) update(escalateMissedWindow);
  }, [account, tick, update]);

  return null;
}
