"use client";

import { LANGUAGE_OPTIONS } from "@/lib/config";
import { RELATIONSHIPS } from "@/lib/onboardingDraft";
import { TIMEZONES } from "@/lib/timezones";
import type { Language } from "@/lib/types";
import { Banner, Field, RadioCard, Select } from "@/components/ui";
import { WithError, channel, herName, hersName, type StepProps } from "./parts";

const digits = (s: string) => s.replace(/\D/g, "");

export function StepYou({ draft, set, errors }: StepProps) {
  return (
    <div className="space-y-5">
      <WithError error={errors["you.name"]}>
        <Field
          label="Your name"
          value={draft.you.name}
          autoFocus
          onChange={(v) => set((d) => void (d.you.name = v))}
          placeholder="Karen Whitfield"
        />
      </WithError>
      <Select
        label="You are her"
        value={draft.you.relationshipToParent}
        onChange={(v) => set((d) => void (d.you.relationshipToParent = v))}
        options={RELATIONSHIPS}
      />
      <WithError error={errors["you.email"]}>
        <Field
          label="Your email"
          type="email"
          inputMode="email"
          value={draft.you.email}
          onChange={(v) => set((d) => void (d.you.email = v))}
          placeholder="you@example.com"
        />
      </WithError>
      <WithError error={errors["you.phone"]}>
        <Field
          label="Your mobile"
          type="tel"
          inputMode="tel"
          hint="If something is off, this is the number we call."
          value={draft.you.phone}
          onChange={(v) => set((d) => void (d.you.phone = v))}
          placeholder="(617) 555-0148"
        />
      </WithError>
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

export function StepParent({ draft, set, errors }: StepProps) {
  return (
    <div className="space-y-5">
      <WithError error={errors["parent.preferredName"]}>
        <Field
          label="What do you call her?"
          hint="This is what our team will call her too."
          value={draft.parent.preferredName}
          autoFocus
          onChange={(v) => set((d) => void (d.parent.preferredName = v))}
          placeholder="Margaret"
        />
      </WithError>
      <Field
        label="Her full name (optional)"
        value={draft.parent.fullName}
        onChange={(v) => set((d) => void (d.parent.fullName = v))}
        placeholder="Margaret Whitfield"
      />
      <WithError error={errors["parent.phone"]}>
        <Field
          label={channel.contactLabel}
          type="tel"
          inputMode="tel"
          hint={channel.contactHint}
          value={draft.parent.phone}
          onChange={(v) => set((d) => void (d.parent.phone = v))}
          placeholder="(312) 555-0192"
        />
      </WithError>
      <Select
        label="Her timezone"
        hint="Her check-in runs on her clock, wherever you are."
        value={draft.parent.parentTimezone}
        onChange={(v) => set((d) => void (d.parent.parentTimezone = v))}
        options={TIMEZONES}
      />
      <Select
        label="The language she speaks"
        hint="Whoever calls her sees this before they dial."
        value={draft.parent.language}
        onChange={(v) => set((d) => void (d.parent.language = v as Language))}
        options={LANGUAGE_OPTIONS}
      />
      <Banner tone="sage" title="No app, no new device, no password.">
        We {channel.verb} the number she already answers.
      </Banner>
    </div>
  );
}

/** AUT-001: the authorized agent is stored separately from the paying account holder. */
export function StepAgent({ draft, set, errors }: StepProps) {
  const hers = hersName(draft);
  const separate = draft.agent.iAmTheAgent === false;

  return (
    <div className="space-y-5">
      <WithError error={errors["agent.choice"]}>
        <div className="space-y-3" role="group" aria-label="Who decides">
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
      </WithError>

      {separate ? (
        <div className="space-y-5 border-t border-line pt-5">
          <WithError error={errors["agent.name"]}>
            <Field
              label="Their name"
              value={draft.agent.name}
              onChange={(v) => set((d) => void (d.agent.name = v))}
              placeholder="Denise Reyes-Okonjo"
            />
          </WithError>
          <Select
            label={`They are ${hers}`}
            value={draft.agent.relationshipToParent}
            onChange={(v) =>
              set((d) => void (d.agent.relationshipToParent = v))
            }
            options={RELATIONSHIPS}
          />
          <WithError error={errors["agent.email"]}>
            <Field
              label="Their email"
              type="email"
              inputMode="email"
              hint="We send them the invitation here."
              value={draft.agent.email}
              onChange={(v) => set((d) => void (d.agent.email = v))}
              placeholder="them@example.com"
            />
          </WithError>
          <Field
            label="Their mobile (optional)"
            type="tel"
            inputMode="tel"
            value={draft.agent.phone}
            onChange={(v) => set((d) => void (d.agent.phone = v))}
            placeholder="(718) 555-0126"
          />
          <Banner tone="amber" title="You'll still pay, but they'll decide.">
            You keep the card and the subscription. Changes to {hers} check-in,
            emergency contact or care notes go to them. We&apos;ll invite them
            by email.
          </Banner>
        </div>
      ) : null}
    </div>
  );
}

export function StepEmergency({ draft, set, errors }: StepProps) {
  const her = herName(draft);
  const youPhone = digits(draft.you.phone);
  const isYou =
    youPhone.length > 0 && digits(draft.emergency.phone) === youPhone;

  return (
    <div className="space-y-5">
      <WithError error={errors["emergency.name"]}>
        <Field
          label="Name"
          value={draft.emergency.name}
          autoFocus
          onChange={(v) => set((d) => void (d.emergency.name = v))}
          placeholder="Dale Whitfield"
        />
      </WithError>
      <Field
        label={`They are ${hersName(draft)} (optional)`}
        value={draft.emergency.relationship}
        onChange={(v) => set((d) => void (d.emergency.relationship = v))}
        placeholder="Neighbor"
      />
      <WithError error={errors["emergency.phone"]}>
        <Field
          label="Phone"
          type="tel"
          inputMode="tel"
          value={draft.emergency.phone}
          onChange={(v) => set((d) => void (d.emergency.phone = v))}
          placeholder="(312) 555-0110"
        />
      </WithError>
      {draft.you.name.trim() && !isYou ? (
        <button
          type="button"
          onClick={() =>
            set((d) => {
              d.emergency.name = d.you.name;
              d.emergency.phone = d.you.phone;
              d.emergency.relationship = d.you.relationshipToParent;
            })
          }
          className="py-1 text-[14px] font-medium text-sage underline underline-offset-4"
        >
          I live close enough — use my details
        </button>
      ) : null}
      {isYou ? (
        <Banner tone="neutral" title="That's you, and that's fine.">
          If someone lives closer to {her} — a neighbor, a friend down the
          street — they are the better choice.{" "}
          {draft.agent.iAmTheAgent === false
            ? `${draft.agent.name.trim() || "The person who decides"} can change this later.`
            : "You can change this later."}
        </Banner>
      ) : (
        <Banner tone="neutral" title="One person is enough.">
          Someone who could physically get to {her} today. We only call them if
          we cannot reach her and cannot reach you.
        </Banner>
      )}
    </div>
  );
}
