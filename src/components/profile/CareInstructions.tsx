"use client";

import { useState } from "react";
import {
  Button,
  Card,
  Chip,
  Field,
  SectionTitle,
  Select,
  TextArea,
} from "@/components/ui";
import { CHANNEL_COPY, CHECK_IN } from "@/lib/config";
import { NORMAL_DAY_TAGS } from "@/lib/onboardingDraft";
import { canEditCareInstructions } from "@/lib/permissions";
import { useAccount } from "@/lib/store";
import { TIMEZONES, formatWindow, timezoneLabel } from "@/lib/timezones";
import type { Account } from "@/lib/types";
import { AgentLock, CardHead, Row } from "./parts";

type Section = "reach" | "window" | "emergency" | "day";

/** AUT-001: only the authorized agent edits. Everyone else reads, and is told why. */
export function CareInstructions({ account }: { account: Account }) {
  const { update } = useAccount();
  const [editing, setEditing] = useState<Section | null>(null);
  const { parent } = account;
  const channel = CHANNEL_COPY[parent.channel];
  const canEdit = canEditCareInstructions(account);
  const done = (
    <Button variant="secondary" onClick={() => setEditing(null)}>
      Done
    </Button>
  );
  const head = (section: Section, title: string) => (
    <CardHead
      title={title}
      canEdit={canEdit}
      editing={editing === section}
      onEdit={() => setEditing(section)}
    />
  );

  const startHours = Array.from(
    {
      length:
        CHECK_IN.latestEndHour -
        CHECK_IN.windowLengthHours -
        CHECK_IN.earliestStartHour +
        1,
    },
    (_, i) => CHECK_IN.earliestStartHour + i,
  );

  return (
    <div className="mt-8">
      <SectionTitle>Care instructions</SectionTitle>
      {canEdit ? null : (
        <div className="mb-3">
          <AgentLock account={account} />
        </div>
      )}
      <div className="space-y-3">
        <Card>
          {head("reach", "How we reach her")}
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
                onChange={(v) =>
                  update((d) => ((d.parent.parentTimezone = v), d))
                }
                options={TIMEZONES}
              />
              {done}
            </div>
          ) : (
            <>
              <Row label="Channel" value={`Daily ${channel.noun}`} />
              <Row label="Number" value={parent.phone} />
              <Row
                label="Her timezone"
                value={timezoneLabel(parent.parentTimezone)}
              />
            </>
          )}
        </Card>

        <Card>
          {head("window", "Check-in window")}
          {editing === "window" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2.5">
                {startHours.map((h) => (
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
              {done}
            </div>
          ) : (
            <>
              <p className="font-serif text-2xl text-ink">
                {formatWindow(
                  parent.checkInWindow.startHour,
                  CHECK_IN.windowLengthHours,
                )}
              </p>
              <p className="mt-1 text-[14px] text-muted">
                {timezoneLabel(parent.parentTimezone)}, every day
              </p>
            </>
          )}
        </Card>

        <Card>
          {head("emergency", "Emergency contact")}
          {editing === "emergency" ? (
            <div className="space-y-4">
              <Field
                label="Name"
                value={parent.emergencyContact.name}
                onChange={(v) =>
                  update((d) => ((d.parent.emergencyContact.name = v), d))
                }
              />
              <Field
                label="Relationship"
                value={parent.emergencyContact.relationship}
                onChange={(v) =>
                  update(
                    (d) => ((d.parent.emergencyContact.relationship = v), d),
                  )
                }
              />
              <Field
                label="Phone"
                type="tel"
                inputMode="tel"
                value={parent.emergencyContact.phone}
                onChange={(v) =>
                  update((d) => ((d.parent.emergencyContact.phone = v), d))
                }
              />
              {done}
            </div>
          ) : (
            <>
              <Row label="Name" value={parent.emergencyContact.name} />
              <Row
                label="Relationship"
                value={parent.emergencyContact.relationship}
              />
              <Row label="Phone" value={parent.emergencyContact.phone} />
            </>
          )}
        </Card>

        <Card>
          {head("day", "What a normal day looks like")}
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
                        const tags = d.parent.normalDay.tags;
                        d.parent.normalDay.tags = tags.includes(tag)
                          ? tags.filter((t) => t !== tag)
                          : [...tags, tag];
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
                onChange={(v) =>
                  update((d) => ((d.parent.normalDay.notes = v), d))
                }
              />
              {done}
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
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
