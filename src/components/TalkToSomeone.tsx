"use client";

import { useState } from "react";
import { Button } from "./ui";

/**
 * ESC-001: one always-visible route to a human being, on any screen — including
 * the landing page and mid-wizard, which do not use AppShell.
 * The acknowledgement SLA itself is BLOCKED in the scope sheet (it follows from
 * staffing and coverage hours), so the copy quotes ESC-001's 15 minutes and
 * hedges with "usually" until Ops fixes the number.
 */
export function TalkToSomeone({ variant = "tab" }: { variant?: "tab" | "link" }) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);

  return (
    <>
      {variant === "tab" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex flex-col items-center gap-1 px-3 py-2 text-[11px] font-medium text-sage"
        >
          <span className="grid h-9 w-9 place-items-center rounded-full bg-sage text-white">
            <svg viewBox="0 0 20 20" aria-hidden className="h-4.5 w-4.5 fill-current">
              <path d="M7.3 2.5a1.4 1.4 0 0 1 1.9.5l1.1 1.9a1.4 1.4 0 0 1-.3 1.8l-1 .8a8.4 8.4 0 0 0 3.5 3.5l.8-1a1.4 1.4 0 0 1 1.8-.3l1.9 1.1a1.4 1.4 0 0 1 .5 1.9l-.8 1.4c-.5.9-1.6 1.3-2.6 1A14.6 14.6 0 0 1 3.9 6c-.3-1 .1-2.1 1-2.6l1.4-.8Z" />
            </svg>
          </span>
          Talk to someone
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-[13px] font-medium text-sage"
        >
          <svg viewBox="0 0 20 20" aria-hidden className="h-3.5 w-3.5 fill-current">
            <path d="M7.3 2.5a1.4 1.4 0 0 1 1.9.5l1.1 1.9a1.4 1.4 0 0 1-.3 1.8l-1 .8a8.4 8.4 0 0 0 3.5 3.5l.8-1a1.4 1.4 0 0 1 1.8-.3l1.9 1.1a1.4 1.4 0 0 1 .5 1.9l-.8 1.4c-.5.9-1.6 1.3-2.6 1A14.6 14.6 0 0 1 3.9 6c-.3-1 .1-2.1 1-2.6l1.4-.8Z" />
          </svg>
          Talk to someone
        </button>
      )}

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-6">
          <div className="w-full max-w-md rounded-t-3xl bg-surface p-6 sm:rounded-3xl">
            {sent ? (
              <>
                <h2 className="font-serif text-2xl text-ink">
                  A Care Specialist has this.
                </h2>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">
                  Someone will call you back, usually within 15 minutes during
                  staffed hours. This will not close itself.
                </p>
                <div className="mt-6">
                  <Button
                    full
                    onClick={() => {
                      setOpen(false);
                      setSent(false);
                    }}
                  >
                    Done
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h2 className="font-serif text-2xl text-ink">Talk to someone</h2>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">
                  A US-based Care Specialist will call you. Not a chatbot, not a
                  queue you have to sit in.
                </p>
                <div className="mt-6 space-y-3">
                  <Button full onClick={() => setSent(true)}>
                    Ask for a call back
                  </Button>
                  <Button full variant="secondary" onClick={() => setOpen(false)}>
                    Not now
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
