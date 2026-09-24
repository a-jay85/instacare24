"use client";

import { useState } from "react";
import { requestCallback } from "@/lib/actions";
import { currentMember } from "@/lib/permissions";
import { useAccount } from "@/lib/store";
import { Button, Sheet, TextArea } from "./ui";

const PHONE_ICON =
  "M7.3 2.5a1.4 1.4 0 0 1 1.9.5l1.1 1.9a1.4 1.4 0 0 1-.3 1.8l-1 .8a8.4 8.4 0 0 0 3.5 3.5l.8-1a1.4 1.4 0 0 1 1.8-.3l1.9 1.1a1.4 1.4 0 0 1 .5 1.9l-.8 1.4c-.5.9-1.6 1.3-2.6 1A14.6 14.6 0 0 1 3.9 6c-.3-1 .1-2.1 1-2.6l1.4-.8Z";

/**
 * ESC-001: one always-visible route to a human being, on any screen — including
 * the landing page and mid-wizard, which do not use AppShell.
 * The acknowledgement SLA itself is BLOCKED in the scope sheet (it follows from
 * staffing and coverage hours), so the copy quotes ESC-001's 15 minutes and
 * hedges with "usually" until Ops fixes the number.
 *
 * When there is an account, the request becomes a real escalation, so it shows
 * up in the staff console and on the family's Today screen (ESC-003).
 */
export function TalkToSomeone({
  variant = "tab",
}: {
  variant?: "tab" | "link";
}) {
  const { account, update } = useAccount();
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [note, setNote] = useState("");

  const close = () => {
    setOpen(false);
    setSent(false);
    setNote("");
  };

  const send = () => {
    if (account) {
      const me = currentMember(account)?.name ?? "The family";
      update((a) => requestCallback(a, me, note.trim()));
    }
    setSent(true);
  };

  const specialist = account?.careTeam.specialistName;

  return (
    <>
      {variant === "tab" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex flex-col items-center gap-1 px-2 py-2 text-[11px] font-medium text-sage-dark"
        >
          <span className="grid h-11 w-11 -translate-y-1 place-items-center rounded-full bg-sage text-white shadow-md shadow-sage/30">
            <svg
              viewBox="0 0 20 20"
              aria-hidden
              className="h-5 w-5 fill-current"
            >
              <path d={PHONE_ICON} />
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
          <svg
            viewBox="0 0 20 20"
            aria-hidden
            className="h-3.5 w-3.5 fill-current"
          >
            <path d={PHONE_ICON} />
          </svg>
          Talk to someone
        </button>
      )}

      <Sheet
        open={open}
        onClose={close}
        title={
          sent
            ? `${specialist ?? "A Care Specialist"} has this.`
            : "Talk to someone"
        }
      >
        {sent ? (
          <>
            <p className="text-[15px] leading-relaxed text-muted">
              {specialist
                ? `${specialist}, your Care Specialist,`
                : "A Care Specialist"}{" "}
              will call you back, usually within 15 minutes during staffed
              hours. This will not close itself.
            </p>
            <div className="mt-6">
              <Button full onClick={close}>
                Done
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-[15px] leading-relaxed text-muted">
              A US-based Care Specialist will call you. Not a chatbot, not a
              queue you have to sit in.
            </p>
            {account ? (
              <div className="mt-4">
                <TextArea
                  label="What's on your mind? (optional)"
                  value={note}
                  onChange={setNote}
                  rows={3}
                  placeholder="She sounded confused on the phone last night…"
                />
              </div>
            ) : null}
            <div className="mt-6 space-y-3">
              <Button full onClick={send}>
                Ask for a call back
              </Button>
              <Button full variant="secondary" onClick={close}>
                Not now
              </Button>
            </div>
          </>
        )}
      </Sheet>
    </>
  );
}
