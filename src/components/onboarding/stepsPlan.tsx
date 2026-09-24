"use client";

import { CHECK_IN, PRICE_MONTHLY } from "@/lib/config";
import { NORMAL_DAY_TAGS } from "@/lib/onboardingDraft";
import { timezoneLabel } from "@/lib/timezones";
import { Chip, Field, TextArea } from "@/components/ui";
import {
  WithError,
  channel,
  compactWindow,
  familyWindow,
  herName,
  hersName,
  type StepProps,
} from "./parts";
import { formatCard, formatExpiry } from "./validate";

/** Configurable values: any 2-hour window, 07:00–19:00 parent-local, default 09:00. */
export function StepWindow({ draft, set }: StepProps) {
  const starts: number[] = [];
  for (
    let h = CHECK_IN.earliestStartHour;
    h + CHECK_IN.windowLengthHours <= CHECK_IN.latestEndHour;
    h++
  ) {
    starts.push(h);
  }
  const yours = familyWindow(draft, CHECK_IN.windowLengthHours);
  const tz = timezoneLabel(draft.parent.parentTimezone);

  return (
    <div className="space-y-5">
      <div
        role="group"
        aria-label="Check-in window"
        className="grid grid-cols-2 gap-2.5"
      >
        {starts.map((h) => {
          const selected = draft.window.startHour === h;
          return (
            <button
              key={h}
              type="button"
              aria-pressed={selected}
              onClick={() => set((d) => void (d.window.startHour = h))}
              className={`rounded-xl border px-3 py-3.5 text-[15px] font-medium transition-colors ${
                selected
                  ? "border-sage bg-sage text-white"
                  : "border-line bg-surface text-ink hover:border-sage/40"
              }`}
            >
              {compactWindow(h, CHECK_IN.windowLengthHours)}
            </button>
          );
        })}
      </div>
      <p className="text-[14px] leading-relaxed text-muted">
        {yours ? (
          <>
            Times are {hersName(draft)} clock, {tz}. For you that&apos;s{" "}
            <span className="font-medium text-ink">{yours}</span>.
          </>
        ) : (
          <>
            Times are {tz} — {hersName(draft)} clock, which is also yours.
          </>
        )}
      </p>
    </div>
  );
}

export function StepNormalDay({ draft, set, errors }: StepProps) {
  const her = herName(draft);
  return (
    <div className="space-y-5">
      <WithError error={errors["normalDay.any"]}>
        <p className="mb-3 text-sm font-medium text-ink">
          Anything that fits {her}
        </p>
        <div className="flex flex-wrap gap-2">
          {NORMAL_DAY_TAGS.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              selected={draft.normalDay.tags.includes(tag)}
              onToggle={() =>
                set((d) => {
                  d.normalDay.tags = d.normalDay.tags.includes(tag)
                    ? d.normalDay.tags.filter((t) => t !== tag)
                    : [...d.normalDay.tags, tag];
                })
              }
            />
          ))}
        </div>
      </WithError>
      <TextArea
        label="What should we know before the first call?"
        hint="The person who calls her has never met her. This is how she stops being a stranger."
        rows={5}
        value={draft.normalDay.notes}
        onChange={(v) => set((d) => void (d.normalDay.notes = v))}
        placeholder="She does the crossword every morning and will talk about it. If she doesn't pick up before nine she's usually in the shower."
      />
    </div>
  );
}

/** BIL-001: one tier, card on file. The card never reaches storage in the prototype. */
export function StepPayment({ draft, set, errors }: StepProps) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex items-baseline justify-between">
          <span className="text-[15px] font-medium text-ink">InstaCare24</span>
          <span className="font-serif text-2xl text-ink">
            ${PRICE_MONTHLY}
            <span className="font-sans text-[14px] text-muted"> / month</span>
          </span>
        </div>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          A daily {channel.noun} to {herName(draft)}, an honest update to you,
          and a real person when something is off.
        </p>
      </div>

      <WithError error={errors["payment.cardNumber"]}>
        <Field
          label="Card number"
          inputMode="numeric"
          value={draft.payment.cardNumber}
          onChange={(v) =>
            set((d) => void (d.payment.cardNumber = formatCard(v)))
          }
          placeholder="4242 4242 4242 4242"
        />
      </WithError>
      <div className="grid grid-cols-2 gap-4">
        <WithError error={errors["payment.expiry"]}>
          <Field
            label="Expiry"
            inputMode="numeric"
            value={draft.payment.expiry}
            onChange={(v) =>
              set(
                (d) =>
                  void (d.payment.expiry = formatExpiry(v, d.payment.expiry)),
              )
            }
            placeholder="MM / YY"
          />
        </WithError>
        <WithError error={errors["payment.cvc"]}>
          <Field
            label="CVC"
            inputMode="numeric"
            value={draft.payment.cvc}
            onChange={(v) =>
              set(
                (d) => void (d.payment.cvc = v.replace(/\D/g, "").slice(0, 4)),
              )
            }
            placeholder="123"
          />
        </WithError>
      </div>
      <WithError error={errors["payment.zip"]}>
        <Field
          label="Billing ZIP"
          inputMode="numeric"
          value={draft.payment.zip}
          onChange={(v) =>
            set((d) => void (d.payment.zip = v.replace(/\D/g, "").slice(0, 5)))
          }
          placeholder="02139"
        />
      </WithError>
      {/* BIL-001: cancel without contacting anyone, no retention gate. */}
      <p className="text-[13px] leading-relaxed text-muted">
        Cancel any time from your profile. No phone call, no chat, nobody trying
        to talk you out of it.
      </p>
      <p className="text-[12px] leading-relaxed text-faint">
        Prototype — nothing is charged and the card is not saved. Any test
        number works, like 4242 4242 4242 4242.
      </p>
    </div>
  );
}
