"use client";

import { CHANNEL_COPY, CHECK_IN, PARENT_CHANNEL, PRICE_MONTHLY } from "@/lib/config";
import { NORMAL_DAY_TAGS, RELATIONSHIPS, type Draft } from "@/lib/onboardingDraft";
import { TIMEZONES, formatWindow, timezoneLabel } from "@/lib/timezones";
import { Banner, Button, Chip, Field, RadioCard, Select, TextArea } from "@/components/ui";

const channel = CHANNEL_COPY[PARENT_CHANNEL];

type StepProps = {
  draft: Draft;
  set: (patch: (d: Draft) => void) => void;
};

export function StepYou({ draft, set }: StepProps) {
  return (
    <div className="space-y-5">
      <Field
        label="Your name"
        value={draft.you.name}
        autoFocus
        onChange={(v) => set((d) => void (d.you.name = v))}
        placeholder="Karen Whitfield"
      />
      <Select
        label="You are her"
        value={draft.you.relationshipToParent}
        onChange={(v) => set((d) => void (d.you.relationshipToParent = v))}
        options={RELATIONSHIPS}
      />
      <Field
        label="Your email"
        type="email"
        inputMode="email"
        value={draft.you.email}
        onChange={(v) => set((d) => void (d.you.email = v))}
        placeholder="you@example.com"
      />
      <Field
        label="Your mobile"
        type="tel"
        inputMode="tel"
        value={draft.you.phone}
        onChange={(v) => set((d) => void (d.you.phone = v))}
        placeholder="(617) 555-0148"
      />
      <Select
        label="Your timezone"
        hint="We use this for your notifications and quiet hours — not for her calls."
        value={draft.you.familyTimezone}
        onChange={(v) => set((d) => void (d.you.familyTimezone = v))}
        options={TIMEZONES}
      />
    </div>
  );
}

export function StepParent({ draft, set }: StepProps) {
  return (
    <div className="space-y-5">
      <Field
        label="What do you call her?"
        hint="This is what our team will call her too."
        value={draft.parent.preferredName}
        autoFocus
        onChange={(v) => set((d) => void (d.parent.preferredName = v))}
        placeholder="Margaret"
      />
      <Field
        label="Her full name"
        value={draft.parent.fullName}
        onChange={(v) => set((d) => void (d.parent.fullName = v))}
        placeholder="Margaret Whitfield"
      />
      <Field
        label={channel.contactLabel}
        type="tel"
        inputMode="tel"
        hint={channel.contactHint}
        value={draft.parent.phone}
        onChange={(v) => set((d) => void (d.parent.phone = v))}
        placeholder="(312) 555-0192"
      />
      <Select
        label="Her timezone"
        hint="Her check-in runs on her clock, wherever you are."
        value={draft.parent.parentTimezone}
        onChange={(v) => set((d) => void (d.parent.parentTimezone = v))}
        options={TIMEZONES}
      />
      <Banner tone="sage" title={`She does not have to set anything up.`}>
        No app, no new device, no password. We {channel.verb} the number she
        already answers.
      </Banner>
    </div>
  );
}

/** AUT-001: the authorized agent is stored separately from the paying account holder. */
export function StepAgent({ draft, set }: StepProps) {
  const hers = draft.parent.preferredName ? `${draft.parent.preferredName}'s` : "her";
  const separate = draft.agent.iAmTheAgent === false;

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <RadioCard
          selected={draft.agent.iAmTheAgent === true}
          onSelect={() => set((d) => void (d.agent.iAmTheAgent = true))}
          title="That's me"
          description={`I hold ${hers} power of attorney or healthcare proxy.`}
        />
        <RadioCard
          selected={separate}
          onSelect={() => set((d) => void (d.agent.iAmTheAgent = false))}
          title="Someone else"
          description="A sibling, another relative, or an attorney holds it."
        />
      </div>

      {separate ? (
        <div className="space-y-5 border-t border-line pt-5">
          <Field
            label="Their name"
            value={draft.agent.name}
            onChange={(v) => set((d) => void (d.agent.name = v))}
            placeholder="Denise Reyes-Okonjo"
          />
          <Select
            label={`They are ${hers}`}
            value={draft.agent.relationshipToParent}
            onChange={(v) => set((d) => void (d.agent.relationshipToParent = v))}
            options={RELATIONSHIPS}
          />
          <Field
            label="Their email"
            type="email"
            inputMode="email"
            value={draft.agent.email}
            onChange={(v) => set((d) => void (d.agent.email = v))}
            placeholder="them@example.com"
          />
          <Field
            label="Their mobile"
            type="tel"
            inputMode="tel"
            value={draft.agent.phone}
            onChange={(v) => set((d) => void (d.agent.phone = v))}
            placeholder="(718) 555-0126"
          />
          <Banner tone="amber" title="You'll still pay, but they'll decide.">
            You keep the card and the subscription. Changes to {hers} check-in,
            emergency contact or care notes go to them. We&apos;ll invite them by
            email.
          </Banner>
        </div>
      ) : null}
    </div>
  );
}

/** Configurable values: any 2-hour window, 07:00–19:00 parent-local, default 09:00. */
export function StepWindow({ draft, set }: StepProps) {
  const starts = [];
  for (
    let h = CHECK_IN.earliestStartHour;
    h + CHECK_IN.windowLengthHours <= CHECK_IN.latestEndHour;
    h++
  ) {
    starts.push(h);
  }
  const hers = draft.parent.preferredName ? `${draft.parent.preferredName}'s` : "her";

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2.5">
        {starts.map((h) => {
          const selected = draft.window.startHour === h;
          return (
            <button
              key={h}
              type="button"
              onClick={() => set((d) => void (d.window.startHour = h))}
              className={`rounded-xl border px-3 py-3.5 text-[15px] font-medium transition-colors ${
                selected
                  ? "border-sage bg-sage text-white"
                  : "border-line bg-surface text-ink hover:border-sage/40"
              }`}
            >
              {formatWindow(h, CHECK_IN.windowLengthHours)}
            </button>
          );
        })}
      </div>
      <p className="text-[14px] leading-relaxed text-muted">
        All times are {timezoneLabel(draft.parent.parentTimezone)} — {hers} clock,
        not yours.
      </p>
    </div>
  );
}

export function StepEmergency({ draft, set }: StepProps) {
  const her = draft.parent.preferredName || "her";
  const hers = draft.parent.preferredName ? `${draft.parent.preferredName}'s` : "her";
  return (
    <div className="space-y-5">
      <Field
        label="Name"
        value={draft.emergency.name}
        autoFocus
        onChange={(v) => set((d) => void (d.emergency.name = v))}
        placeholder="Dale Whitfield"
      />
      <Field
        label={`They are ${hers}`}
        value={draft.emergency.relationship}
        onChange={(v) => set((d) => void (d.emergency.relationship = v))}
        placeholder="Neighbour"
      />
      <Field
        label="Phone"
        type="tel"
        inputMode="tel"
        value={draft.emergency.phone}
        onChange={(v) => set((d) => void (d.emergency.phone = v))}
        placeholder="(312) 555-0110"
      />
      <button
        type="button"
        onClick={() =>
          set((d) => {
            d.emergency.name = d.you.name;
            d.emergency.phone = d.you.phone;
            d.emergency.relationship = d.you.relationshipToParent;
          })
        }
        className="text-[14px] font-medium text-sage underline underline-offset-4"
      >
        Use my details
      </button>
      <Banner tone="neutral" title="One person is enough.">
        Someone who could physically get to {her} today. We only call them if we
        cannot reach her and cannot reach you.
      </Banner>
    </div>
  );
}

export function StepNormalDay({ draft, set }: StepProps) {
  const her = draft.parent.preferredName || "her";
  return (
    <div className="space-y-5">
      <div>
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
      </div>
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

export function StepPayment({ draft, set }: StepProps) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex items-baseline justify-between">
          <span className="text-[15px] font-medium text-ink">InstaCare24</span>
          <span className="font-serif text-2xl text-ink">
            ${PRICE_MONTHLY}
            <span className="text-[14px] font-sans text-muted"> / month</span>
          </span>
        </div>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          A daily {channel.noun} to{" "}
          {draft.parent.preferredName || "your mother"}, an honest update to you,
          and a real person when something is off.
        </p>
      </div>

      <Field
        label="Card number"
        inputMode="numeric"
        value={draft.payment.cardNumber}
        onChange={(v) => set((d) => void (d.payment.cardNumber = v))}
        placeholder="4242 4242 4242 4242"
      />
      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Expiry"
          inputMode="numeric"
          value={draft.payment.expiry}
          onChange={(v) => set((d) => void (d.payment.expiry = v))}
          placeholder="09 / 29"
        />
        <Field
          label="CVC"
          inputMode="numeric"
          value={draft.payment.cvc}
          onChange={(v) => set((d) => void (d.payment.cvc = v))}
          placeholder="123"
        />
      </div>
      <Field
        label="Billing ZIP"
        inputMode="numeric"
        value={draft.payment.zip}
        onChange={(v) => set((d) => void (d.payment.zip = v))}
        placeholder="02139"
      />
      {/* BIL-001: cancel without contacting anyone, no retention gate. */}
      <p className="text-[13px] leading-relaxed text-muted">
        Cancel any time from your profile. No phone call, no chat, nobody trying
        to talk you out of it.
      </p>
      <p className="text-[12px] text-faint">
        Prototype — this card form is not connected to anything. Type whatever
        you like.
      </p>
    </div>
  );
}

export function StepDone({
  draft,
  onContinue,
}: {
  draft: Draft;
  onContinue: () => void;
}) {
  const her = draft.parent.preferredName || "your mother";
  return (
    <div className="space-y-6 pt-4">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-moss-soft">
        <svg viewBox="0 0 20 20" aria-hidden className="h-7 w-7 fill-moss">
          <path d="M8.2 13.6 4.9 10.3l-1.2 1.2 4.5 4.5 8-8-1.2-1.2-6.8 6.8Z" />
        </svg>
      </div>
      <div>
        <h1 className="font-serif text-3xl leading-tight text-ink">
          You&apos;re set up.
        </h1>
        <p className="mt-3 text-[16px] leading-relaxed text-muted">
          Her window is saved for{" "}
          <span className="font-medium text-ink">
            {formatWindow(draft.window.startHour, CHECK_IN.windowLengthHours)}
          </span>
          , {timezoneLabel(draft.parent.parentTimezone)}.
        </p>
      </div>

      {/* AUT-002: nothing runs until the parent herself has consented on a recorded call. */}
      <Banner tone="amber" title={`Next: we speak to ${her}.`}>
        A Care Specialist will {channel.verb} her within 24 hours to ask whether
        she is happy to get a daily check-in. Daily calls start once she says
        yes. We will not call her before that.
      </Banner>

      <p className="text-[14px] leading-relaxed text-muted">
        You will see her answer in your feed either way. If she says no, you will
        hear that from us, not from her.
      </p>

      <Button full onClick={onContinue}>
        Go to my feed
      </Button>
    </div>
  );
}
