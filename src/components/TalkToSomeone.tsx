"use client";

import { useState } from "react";
import { requestCallback } from "@/lib/actions";
import { requestCallbackWithoutAccount } from "@/lib/callbacks";
import { loadDraft } from "@/lib/onboardingDraft";
import { currentMember } from "@/lib/permissions";
import { useAccount } from "@/lib/store";
import { Button, Field, Sheet, TextArea } from "./ui";

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
 * up in the staff console and on the family's Today screen (ESC-003). Before
 * there is one, we ask for a name and a number and the console lists it as a
 * call-back request (src/lib/callbacks.ts).
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
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const start = () => {
    // Mid-wizard, they have usually typed these already.
    if (!account) {
      const you = loadDraft()?.draft.you;
      setName((n) => n || you?.name || "");
      setPhone((p) => p || you?.phone || "");
    }
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    setSent(false);
    setNote("");
  };

  const canSend = Boolean(
    account || (name.trim() && phone.replace(/\D/g, "").length >= 10),
  );

  const send = () => {
    if (!canSend) return;
    if (account) {
      const me = currentMember(account)?.name ?? "The family";
      update((a) => requestCallback(a, me, note.trim()));
    } else {
      requestCallbackWithoutAccount({
        name: name.trim(),
        phone: phone.trim(),
        note: note.trim(),
      });
    }
    setSent(true);
  };

  const specialist = account?.careTeam.specialistName;

  return (
    <>
      {variant === "tab" ? (
        <button
          type="button"
          onClick={start}
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
          onClick={start}
          className="flex min-h-11 items-center gap-1.5 text-[13px] font-medium text-sage"
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
            ? `We've asked ${specialist ?? "a Care Specialist"} to call you.`
            : "Talk to someone"
        }
      >
        {sent ? (
          <>
            <p className="text-[15px] leading-relaxed text-muted">
              {specialist
                ? `${specialist}, your Care Specialist,`
                : "A Care Specialist"}{" "}
              will call you back{account ? "" : ` on ${phone.trim()}`}, usually
              within 15 minutes during staffed hours. This will not close
              itself.
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
            <div className="mt-4 space-y-4">
              {account ? null : (
                <>
                  <Field label="Your name" value={name} onChange={setName} />
                  <Field
                    label="Your phone number"
                    hint="The number we should call."
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={setPhone}
                  />
                </>
              )}
              <TextArea
                label="What's on your mind? (optional)"
                value={note}
                onChange={setNote}
                rows={3}
                placeholder="She sounded confused on the phone last night…"
              />
            </div>
            <div className="mt-6 space-y-3">
              <Button full onClick={send} disabled={!canSend}>
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
