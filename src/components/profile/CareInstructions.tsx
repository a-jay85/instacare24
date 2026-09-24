"use client";

import { useRef, useState } from "react";
import {
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
import {
  TIMEZONES,
  formatHour,
  formatWindow,
  timezoneLabel,
} from "@/lib/timezones";
import type { Account, ParentProfile } from "@/lib/types";
import { AgentLock, CardHead, EditActions, FOCUS_RING, Row } from "./parts";

type Section = "reach" | "window" | "emergency" | "day";

const START_HOURS = Array.from(
  {
    length:
      CHECK_IN.latestEndHour -
      CHECK_IN.windowLengthHours -
      CHECK_IN.earliestStartHour +
      1,
  },
  (_, i) => CHECK_IN.earliestStartHour + i,
);

/**
 * AUT-001: only the authorized agent edits. Everyone else reads, and is told
 * why. Edits happen on a draft and are written on Save, so a half-typed phone
 * number never reaches whoever calls her.
 */
export function CareInstructions({ account }: { account: Account }) {
  const { update } = useAccount();
  const [editing, setEditing] = useState<Section | null>(null);
  const [draft, setDraft] = useState<ParentProfile>(account.parent);
  const editRefs = useRef<Record<Section, HTMLButtonElement | null>>({
    reach: null,
    window: null,
    emergency: null,
    day: null,
  });
  const { parent } = account;
  const channel = CHANNEL_COPY[parent.channel];
  const canEdit = canEditCareInstructions(account);

  const edit = (p: Partial<ParentProfile>) => setDraft((d) => ({ ...d, ...p }));
  const start = (section: Section) => {
    setDraft(structuredClone(parent));
    setEditing(section);
  };
  const close = () => {
    const section = editing;
    setEditing(null);
    if (section)
      requestAnimationFrame(() => editRefs.current[section]?.focus());
  };
  const save = () => {
    const d = draft;
    update((a) => {
      if (editing === "reach") {
        a.parent.phone = d.phone.trim();
        a.parent.parentTimezone = d.parentTimezone;
      } else if (editing === "window") {
        a.parent.checkInWindow = { ...d.checkInWindow };
      } else if (editing === "emergency") {
        a.parent.emergencyContact = {
          name: d.emergencyContact.name.trim(),
          relationship: d.emergencyContact.relationship.trim(),
          phone: d.emergencyContact.phone.trim(),
        };
      } else if (editing === "day") {
        a.parent.normalDay = {
          ...d.normalDay,
          notes: d.normalDay.notes.trim(),
        };
      }
      return a;
    });
    close();
  };

  const head = (section: Section, title: string) => (
    <CardHead
      title={title}
      canEdit={canEdit}
      editing={editing === section}
      onEdit={() => start(section)}
      editRef={(el) => {
        editRefs.current[section] = el;
      }}
    />
  );
  const ec = draft.emergencyContact;

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
                autoFocus
                value={draft.phone}
                onChange={(v) => edit({ phone: v })}
              />
              <Select
                label="Her timezone"
                hint="Her check-in and her medication reminders run on this clock."
                value={draft.parentTimezone}
                onChange={(v) => edit({ parentTimezone: v })}
                options={TIMEZONES}
              />
              <EditActions
                onSave={save}
                onCancel={close}
                canSave={draft.phone.trim().length >= 7}
              />
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
              <div
                role="radiogroup"
                aria-label="Check-in window"
                className="grid grid-cols-2 gap-2.5"
              >
                {START_HOURS.map((h) => {
                  const on = draft.checkInWindow.startHour === h;
                  return (
                    <button
                      key={h}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => edit({ checkInWindow: { startHour: h } })}
                      className={`min-h-11 rounded-xl border px-2 py-2.5 text-[15px] font-medium ${FOCUS_RING} ${
                        on
                          ? "border-sage bg-sage text-white"
                          : "border-line bg-surface text-ink hover:border-sage/40"
                      }`}
                    >
                      <span className="block whitespace-nowrap">
                        {formatHour(h)}
                      </span>
                      <span
                        className={`block whitespace-nowrap text-[12px] font-normal ${on ? "text-white/80" : "text-muted"}`}
                      >
                        to {formatHour(h + CHECK_IN.windowLengthHours)}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[13px] text-muted">
                On her clock: {timezoneLabel(parent.parentTimezone)}.
              </p>
              <EditActions onSave={save} onCancel={close} />
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
                autoFocus
                value={ec.name}
                onChange={(v) => edit({ emergencyContact: { ...ec, name: v } })}
              />
              <Field
                label="Relationship"
                value={ec.relationship}
                onChange={(v) =>
                  edit({ emergencyContact: { ...ec, relationship: v } })
                }
              />
              <Field
                label="Phone"
                type="tel"
                inputMode="tel"
                value={ec.phone}
                onChange={(v) =>
                  edit({ emergencyContact: { ...ec, phone: v } })
                }
              />
              <EditActions
                onSave={save}
                onCancel={close}
                canSave={
                  ec.name.trim().length > 0 && ec.phone.trim().length >= 7
                }
              />
            </div>
          ) : (
            <>
              <Row label="Name" value={parent.emergencyContact.name} />
              <Row
                label="Relationship"
                value={parent.emergencyContact.relationship || "Not given"}
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
                {NORMAL_DAY_TAGS.map((tag) => {
                  const tags = draft.normalDay.tags;
                  return (
                    <Chip
                      key={tag}
                      label={tag}
                      selected={tags.includes(tag)}
                      onToggle={() =>
                        edit({
                          normalDay: {
                            ...draft.normalDay,
                            tags: tags.includes(tag)
                              ? tags.filter((t) => t !== tag)
                              : [...tags, tag],
                          },
                        })
                      }
                    />
                  );
                })}
              </div>
              <TextArea
                label="Notes for whoever calls her"
                rows={5}
                value={draft.normalDay.notes}
                onChange={(v) =>
                  edit({ normalDay: { ...draft.normalDay, notes: v } })
                }
              />
              <EditActions onSave={save} onCancel={close} />
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
