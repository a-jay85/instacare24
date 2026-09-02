"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  Banner,
  Button,
  Card,
  Chip,
  Field,
  LockNote,
  Pill,
  SectionTitle,
  Select,
  TextArea,
} from "@/components/ui";
import { CHANNEL_COPY, CHECK_IN, CONSENT_CALL_SLA_HOURS } from "@/lib/config";
import { NORMAL_DAY_TAGS } from "@/lib/onboardingDraft";
import {
  authorizedAgent,
  canEditCareInstructions,
  canManageBilling,
  currentMember,
  roleLabel,
} from "@/lib/permissions";
import { useAccount } from "@/lib/store";
import { TIMEZONES, formatHour, formatWindow, timezoneLabel } from "@/lib/timezones";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="text-[14px] text-muted">{label}</span>
      <span className="text-right text-[15px] font-medium text-ink">{value}</span>
    </div>
  );
}

function CardHead({
  title,
  canEdit,
  editing,
  onEdit,
}: {
  title: string;
  canEdit: boolean;
  editing: boolean;
  onEdit: () => void;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-[16px] font-semibold text-ink">{title}</h3>
      {canEdit && !editing ? (
        <button
          type="button"
          onClick={onEdit}
          className="text-[14px] font-medium text-sage underline underline-offset-4"
        >
          Edit
        </button>
      ) : null}
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { account, ready, update, clear } = useAccount();

  const [editing, setEditing] = useState<string | null>(null);
  const [showCancel, setShowCancel] = useState(false);

  useEffect(() => {
    if (ready && !account) router.replace("/");
  }, [ready, account, router]);

  if (!ready || !account) return null;

  const { parent } = account;
  const channel = CHANNEL_COPY[parent.channel];
  const me = currentMember(account);
  const agent = authorizedAgent(account);
  const canEditCare = canEditCareInstructions(account);
  const canBill = canManageBilling(account);

  // AUT-001: named, so the read-only state explains itself instead of just blocking.
  const lock = (
    <LockNote>
      Only {agent?.name ?? "the healthcare proxy"} can change this. You pay for
      the service; {agent ? agent.name.split(" ")[0] : "they"} hold
      {agent ? "s" : ""} {parent.preferredName}&apos;s healthcare proxy.
    </LockNote>
  );

  const consent = parent.consent;
  const consentPill =
    consent.state === "granted" ? (
      <Pill tone="moss">She agreed</Pill>
    ) : consent.state === "pending" ? (
      <Pill tone="amber">Waiting on her</Pill>
    ) : consent.state === "withdrawn" ? (
      <Pill tone="clay">She withdrew</Pill>
    ) : (
      <Pill tone="neutral">Not asked yet</Pill>
    );

  return (
    <AppShell>
      <h1 className="font-serif text-[28px] leading-tight text-ink">
        {parent.fullName}
      </h1>
      <p className="mt-1 text-[15px] text-muted">
        Goes by {parent.preferredName} · {timezoneLabel(parent.parentTimezone)}
      </p>

      {/* AUT-002 / AUT-003 */}
      <div className="mt-6">
        <SectionTitle>Her consent</SectionTitle>
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[16px] font-semibold text-ink">
              {parent.preferredName}&apos;s own permission
            </h3>
            {consentPill}
          </div>
          <p className="text-[14px] leading-relaxed text-muted">
            {consent.state === "granted"
              ? `Recorded on a call on ${new Date(consent.decidedAt!).toLocaleDateString()}. She can withdraw it at any time by telling whoever calls her — she does not have to come through you.`
              : consent.state === "pending"
                ? `A Care Specialist will ${channel.verb} her within ${CONSENT_CALL_SLA_HOURS} hours. No check-in can be delivered until she has said yes on a recorded call.`
                : consent.state === "withdrawn"
                  ? "She told us to stop. Check-ins ended within 24 hours. She did not have to give a reason, and we did not ask for one."
                  : "We have not asked her yet."}
          </p>
          {consent.recordingId ? (
            <p className="mt-3 text-[12px] text-faint">
              Recording {consent.recordingId}
            </p>
          ) : null}

          {/* Prototype shortcut — not product. Lets a demo move the state machine. */}
          <div className="mt-4 rounded-xl border border-dashed border-line p-3">
            <p className="mb-2 text-[12px] font-medium uppercase tracking-wider text-faint">
              Prototype shortcut
            </p>
            <div className="flex flex-wrap gap-2">
              {consent.state !== "granted" ? (
                <button
                  type="button"
                  className="rounded-lg border border-line px-3 py-1.5 text-[13px] text-muted hover:text-ink"
                  onClick={() =>
                    update((d) => {
                      d.parent.consent = {
                        state: "granted",
                        requestedAt: d.parent.consent.requestedAt,
                        decidedAt: new Date().toISOString(),
                        recordingId: "rec_" + Math.random().toString(16).slice(2, 8),
                      };
                      return d;
                    })
                  }
                >
                  She said yes
                </button>
              ) : null}
              {consent.state !== "withdrawn" ? (
                <button
                  type="button"
                  className="rounded-lg border border-line px-3 py-1.5 text-[13px] text-muted hover:text-ink"
                  onClick={() =>
                    update((d) => {
                      d.parent.consent = {
                        state: "withdrawn",
                        requestedAt: d.parent.consent.requestedAt,
                        decidedAt: new Date().toISOString(),
                      };
                      return d;
                    })
                  }
                >
                  She withdrew consent
                </button>
              ) : null}
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-8">
        <SectionTitle>Care instructions</SectionTitle>
        <div className="space-y-3">
          {/* How we reach her */}
          <Card>
            <CardHead
              title="How we reach her"
              canEdit={canEditCare}
              editing={editing === "reach"}
              onEdit={() => setEditing("reach")}
            />
            {editing === "reach" ? (
              <div className="space-y-4">
                <Field
                  label={channel.contactLabel}
                  type="tel"
                  inputMode="tel"
                  value={parent.phone}
                  onChange={(v) => update((d) => ((d.parent.phone = v), d))}
                />
                <Select
                  label="Her timezone"
                  hint="Her check-in and her medication reminders run on this clock."
                  value={parent.parentTimezone}
                  onChange={(v) => update((d) => ((d.parent.parentTimezone = v), d))}
                  options={TIMEZONES}
                />
                <Button variant="secondary" onClick={() => setEditing(null)}>
                  Done
                </Button>
              </div>
            ) : (
              <>
                <Row label="Channel" value={`Daily ${channel.noun}`} />
                <Row label="Number" value={parent.phone} />
                <Row label="Her timezone" value={timezoneLabel(parent.parentTimezone)} />
                {!canEditCare ? lock : null}
              </>
            )}
          </Card>

          {/* Check-in window */}
          <Card>
            <CardHead
              title="Check-in window"
              canEdit={canEditCare}
              editing={editing === "window"}
              onEdit={() => setEditing("window")}
            />
            {editing === "window" ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2.5">
                  {Array.from(
                    {
                      length:
                        CHECK_IN.latestEndHour -
                        CHECK_IN.windowLengthHours -
                        CHECK_IN.earliestStartHour +
                        1,
                    },
                    (_, i) => CHECK_IN.earliestStartHour + i,
                  ).map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() =>
                        update((d) => ((d.parent.checkInWindow.startHour = h), d))
                      }
                      className={`rounded-xl border px-3 py-3 text-[14px] font-medium ${
                        parent.checkInWindow.startHour === h
                          ? "border-sage bg-sage text-white"
                          : "border-line bg-surface text-ink"
                      }`}
                    >
                      {formatWindow(h, CHECK_IN.windowLengthHours)}
                    </button>
                  ))}
                </div>
                <Button variant="secondary" onClick={() => setEditing(null)}>
                  Done
                </Button>
              </div>
            ) : (
              <>
                <p className="font-serif text-2xl text-ink">
                  {formatWindow(parent.checkInWindow.startHour, CHECK_IN.windowLengthHours)}
                </p>
                <p className="mt-1 text-[14px] text-muted">
                  {timezoneLabel(parent.parentTimezone)}, every day
                </p>
                {!canEditCare ? lock : null}
              </>
            )}
          </Card>

          {/* Emergency contact */}
          <Card>
            <CardHead
              title="Emergency contact"
              canEdit={canEditCare}
              editing={editing === "emergency"}
              onEdit={() => setEditing("emergency")}
            />
            {editing === "emergency" ? (
              <div className="space-y-4">
                <Field
                  label="Name"
                  value={parent.emergencyContact.name}
                  onChange={(v) => update((d) => ((d.parent.emergencyContact.name = v), d))}
                />
                <Field
                  label="Relationship"
                  value={parent.emergencyContact.relationship}
                  onChange={(v) =>
                    update((d) => ((d.parent.emergencyContact.relationship = v), d))
                  }
                />
                <Field
                  label="Phone"
                  type="tel"
                  inputMode="tel"
                  value={parent.emergencyContact.phone}
                  onChange={(v) => update((d) => ((d.parent.emergencyContact.phone = v), d))}
                />
                <Button variant="secondary" onClick={() => setEditing(null)}>
                  Done
                </Button>
              </div>
            ) : (
              <>
                <Row label="Name" value={parent.emergencyContact.name} />
                <Row label="Relationship" value={parent.emergencyContact.relationship} />
                <Row label="Phone" value={parent.emergencyContact.phone} />
                {!canEditCare ? lock : null}
              </>
            )}
          </Card>

          {/* Normal day */}
          <Card>
            <CardHead
              title="What a normal day looks like"
              canEdit={canEditCare}
              editing={editing === "day"}
              onEdit={() => setEditing("day")}
            />
            {editing === "day" ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {NORMAL_DAY_TAGS.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      selected={parent.normalDay.tags.includes(tag)}
                      onToggle={() =>
                        update((d) => {
                          d.parent.normalDay.tags = d.parent.normalDay.tags.includes(tag)
                            ? d.parent.normalDay.tags.filter((t) => t !== tag)
                            : [...d.parent.normalDay.tags, tag];
                          return d;
                        })
                      }
                    />
                  ))}
                </div>
                <TextArea
                  label="Notes for whoever calls her"
                  rows={5}
                  value={parent.normalDay.notes}
                  onChange={(v) => update((d) => ((d.parent.normalDay.notes = v), d))}
                />
                <Button variant="secondary" onClick={() => setEditing(null)}>
                  Done
                </Button>
              </div>
            ) : (
              <>
                {parent.normalDay.tags.length > 0 ? (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {parent.normalDay.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-line bg-cream px-3 py-1 text-[13px] text-muted"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                ) : null}
                <p className="text-[15px] leading-relaxed text-ink">
                  {parent.normalDay.notes || "Nothing written down yet."}
                </p>
                {!canEditCare ? lock : null}
              </>
            )}
          </Card>
        </div>
      </div>

      {/* AUT-001: two identities, two permission sets, visible rather than implied. */}
      <div className="mt-8">
        <SectionTitle>Who is on this account</SectionTitle>
        <div className="space-y-3">
          {account.members.map((m) => (
            <Card key={m.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[16px] font-semibold text-ink">
                    {m.name}
                    {m.id === me?.id ? (
                      <span className="ml-2 text-[13px] font-normal text-faint">you</span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-[14px] text-muted">
                    {m.relationshipToParent} · {timezoneLabel(m.familyTimezone)}
                  </p>
                </div>
                <Pill tone={m.isAuthorizedAgent ? "sage" : "neutral"}>
                  {roleLabel(m)}
                </Pill>
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-muted">
                {m.isAuthorizedAgent
                  ? "Can change care instructions and end the service."
                  : m.isPayer
                    ? "Holds the card and can cancel the subscription. Cannot change care instructions."
                    : "Can read the feed."}
              </p>
            </Card>
          ))}
        </div>
        {account.members.length === 1 ? (
          <p className="mt-3 text-[13px] leading-relaxed text-faint">
            Inviting a sibling is coming later. For now exactly one person holds
            the write access.
          </p>
        ) : null}
      </div>

      {/* NTF-001: quiet hours are family-local, deliberately not parent-local. */}
      <div className="mt-8">
        <SectionTitle>Your notifications</SectionTitle>
        <Card>
          <CardHead
            title="Quiet hours"
            canEdit
            editing={editing === "quiet"}
            onEdit={() => setEditing("quiet")}
          />
          {editing === "quiet" ? (
            <div className="space-y-4">
              <Select
                label="Start"
                value={String(account.quietHours.startHour)}
                onChange={(v) => update((d) => ((d.quietHours.startHour = Number(v)), d))}
                options={Array.from({ length: 24 }, (_, h) => ({
                  id: String(h),
                  label: formatHour(h),
                }))}
              />
              <Select
                label="End"
                value={String(account.quietHours.endHour)}
                onChange={(v) => update((d) => ((d.quietHours.endHour = Number(v)), d))}
                options={Array.from({ length: 24 }, (_, h) => ({
                  id: String(h),
                  label: formatHour(h),
                }))}
              />
              <Button variant="secondary" onClick={() => setEditing(null)}>
                Done
              </Button>
            </div>
          ) : (
            <>
              <Row
                label="Held until morning"
                value={`${formatHour(account.quietHours.startHour)} – ${formatHour(account.quietHours.endHour)}`}
              />
              <Row
                label="Your timezone"
                value={timezoneLabel(me?.familyTimezone ?? "America/New_York")}
              />
              <p className="mt-3 text-[13px] leading-relaxed text-muted">
                Routine updates wait for morning. Anything urgent comes through
                anyway, at any hour.
              </p>
            </>
          )}
        </Card>
      </div>

      {/* BIL-001 */}
      <div className="mt-8">
        <SectionTitle>Subscription</SectionTitle>
        <Card>
          <Row label="Plan" value={`$${account.subscription.priceMonthly} / month`} />
          <Row label="Card" value={`•••• ${account.subscription.cardLast4 ?? "0000"}`} />
          {canBill ? (
            showCancel ? (
              <div className="mt-4 space-y-3">
                <Banner tone="clay" title="Cancel the subscription?">
                  Billing stops today and the check-ins stop with it. Nobody will
                  call you to talk you out of it.
                </Banner>
                <div className="flex gap-3">
                  <Button
                    variant="danger"
                    onClick={() => {
                      clear();
                      router.push("/");
                    }}
                  >
                    Yes, cancel
                  </Button>
                  <Button variant="secondary" onClick={() => setShowCancel(false)}>
                    Keep it
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <Button variant="secondary" onClick={() => setShowCancel(true)}>
                  Cancel subscription
                </Button>
              </div>
            )
          ) : (
            <LockNote>
              The card belongs to the subscriber. Only they can cancel.
            </LockNote>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
