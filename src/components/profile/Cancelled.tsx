"use client";

import Link from "next/link";
import { PhoneFrame } from "@/components/shell/PhoneFrame";
import { dateLabel } from "./parts";
import { cancelReceipt } from "./Subscription";

/**
 * BIL-001 receipt. The cancel has already happened; this only confirms it.
 * No "are you sure", no offer, no survey.
 */
export function Cancelled({ name, at }: { name: string; at: string }) {
  return (
    <PhoneFrame>
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-6 pb-10">
        <header className="py-6">
          <span className="font-serif text-lg font-semibold text-ink">
            InstaCare<span className="text-sage">24</span>
          </span>
        </header>
        <div className="flex flex-1 flex-col justify-center py-8">
          <h1 className="font-serif text-[30px] leading-tight text-ink">
            Your subscription is cancelled.
          </h1>
          <ul className="mt-5 space-y-3 text-[16px] leading-relaxed text-muted">
            <li>
              Billing stopped on {dateLabel(at)}. You will not be charged again.
            </li>
            <li>
              {name ? `${name}'s` : "Her"} daily calls and reminders have
              stopped.
            </li>
            <li>Nobody will call you about it.</li>
          </ul>
        </div>
        <Link
          href="/"
          onClick={() => {
            cancelReceipt.at = null;
          }}
          className="inline-flex w-full items-center justify-center rounded-xl bg-sage px-5 py-3.5 text-[15px] font-medium text-white hover:bg-sage-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2"
        >
          Close
        </Link>
      </div>
    </PhoneFrame>
  );
}
