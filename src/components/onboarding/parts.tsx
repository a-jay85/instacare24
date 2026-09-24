"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { CHANNEL_COPY, PARENT_CHANNEL } from "@/lib/config";
import type { Draft } from "@/lib/onboardingDraft";
import { hoursApart } from "@/lib/timezones";
import { TalkToSomeone } from "@/components/TalkToSomeone";
import type { Errors } from "./validate";

export const channel = CHANNEL_COPY[PARENT_CHANNEL];

export type StepProps = {
  draft: Draft;
  set: (patch: (d: Draft) => void) => void;
  errors: Errors;
};

/** "Margaret" or "her". */
export const herName = (d: Draft) => d.parent.preferredName.trim() || "her";
/** "Margaret's" or "her". */
export const hersName = (d: Draft) =>
  d.parent.preferredName.trim() ? `${d.parent.preferredName.trim()}'s` : "her";

/**
 * The shared Field has no error slot, so the message sits right under it.
 * `data-field-error` lets the wizard move focus to the first problem.
 */
export function WithError({
  error,
  children,
}: {
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      {children}
      {error ? (
        <p
          data-field-error
          className="mt-1.5 flex items-start gap-1.5 text-[13px] leading-snug text-clay"
        >
          <svg
            viewBox="0 0 16 16"
            aria-hidden
            className="mt-[3px] h-3 w-3 shrink-0 fill-current"
          >
            <path d="M8 1a7 7 0 1 1 0 14A7 7 0 0 1 8 1Zm-.9 3.5.2 5h1.4l.2-5H7.1ZM8 10.6a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8Z" />
          </svg>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function hour12(h: number) {
  const hh = ((h % 24) + 24) % 24;
  return { n: ((hh + 11) % 12) + 1, m: hh < 12 ? "AM" : "PM" };
}

/** 9 -> "9 – 11 AM", 11 -> "11 AM – 1 PM". Short enough for a two-column grid. */
export function compactWindow(start: number, length = 2): string {
  const a = hour12(start);
  const b = hour12(start + length);
  return a.m === b.m
    ? `${a.n} – ${b.n} ${b.m}`
    : `${a.n} ${a.m} – ${b.n} ${b.m}`;
}

/**
 * The same window on the family's clock, or null when both clocks agree.
 * Wraps around midnight (Honolulu vs. Eastern).
 */
export function familyWindow(d: Draft, length = 2): string | null {
  if (d.parent.parentTimezone === d.you.familyTimezone) return null;
  const gap = hoursApart(d.you.familyTimezone, d.parent.parentTimezone);
  if (gap === 0) return null;
  return compactWindow(d.window.startHour + gap, length);
}

export function OnboardingHeader({ right }: { right?: ReactNode }) {
  return (
    <header className="flex items-center justify-between py-5">
      <Link
        href="/"
        className="rounded-md font-serif text-lg font-semibold text-ink"
      >
        InstaCare<span className="text-sage">24</span>
      </Link>
      <div className="flex items-center gap-4">
        <TalkToSomeone variant="link" />
        {right}
      </div>
    </header>
  );
}
