"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AddMedSheet } from "@/components/meds/AddMedSheet";
import { MedRow } from "@/components/meds/MedRow";
import {
  BackLink,
  Banner,
  Button,
  Card,
  LockNote,
  PageTitle,
  SectionTitle,
} from "@/components/ui";
import { acknowledgeMed } from "@/lib/actions";
import { CHANNEL_COPY } from "@/lib/config";
import {
  asNeededMeds,
  doseState,
  parentHourNow,
  remindersOff,
  scheduledMeds,
} from "@/lib/meds";
import { authorizedAgent, canEditCareInstructions } from "@/lib/permissions";
import { useAccount } from "@/lib/store";
import { formatHour, timezoneLabel } from "@/lib/timezones";

export default function MedicationsPage() {
  const router = useRouter();
  const { account, ready, update } = useAccount();
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (ready && !account) router.replace("/");
  }, [ready, account, router]);

  if (!ready || !account) return null;

  const { parent } = account;
  const name = parent.preferredName;
  const channel = CHANNEL_COPY[parent.channel];
  const nowHour = parentHourNow(parent.parentTimezone);
  const canEdit = canEditCareInstructions(account);
  const agent = authorizedAgent(account);
  const off = remindersOff(account);
  const scheduled = scheduledMeds(account);
  const asNeeded = asNeededMeds(account);

  // Prototype shortcut: the first dose today she has not confirmed yet.
  const pending = scheduled
    .flatMap((m) =>
      m.schedule.kind === "scheduled"
        ? m.schedule.hours.map((h) => ({ med: m, hour: h }))
        : [],
    )
    .filter((d) => {
      const st = doseState(account, d.med.id, d.hour, nowHour);
      return st === "upcoming" || st === "no_response";
    })
    .sort((a, b) => a.hour - b.hour)[0];

  const remove = (id: string) =>
    update((d) => {
      d.medications = d.medications.filter((m) => m.id !== id);
      d.medAcks = d.medAcks.filter((a) => a.medId !== id);
      return d;
    });

  return (
    <AppShell>
      <BackLink href="/care" label="Care" />
      <PageTitle
        title="Medications"
        subtitle={`We remind ${name} on her daily ${channel.noun}, at her own time, ${timezoneLabel(parent.parentTimezone)}. You see today only.`}
      />

      {off ? (
        <div className="mb-6">
          {off === "pending" ? (
            <Banner tone="amber" title="No reminders are going out yet.">
              Reminders start once {name} agrees to the calls. Until then
              nothing is sent, and nothing can be missed.
            </Banner>
          ) : off === "withdrawn" ? (
            <Banner tone="neutral" title="Reminders have stopped.">
              {name} asked us to stop calling, so her reminders stopped too. The
              list stays here for you.
            </Banner>
          ) : (
            <Banner tone="neutral" title="Reminders have stopped.">
              Nothing more will be sent.
            </Banner>
          )}
        </div>
      ) : null}

      {/* AUT-001: medications are care instructions. */}
      {!canEdit ? (
        <div className="-mt-3 mb-6">
          <LockNote>
            Only {agent?.name ?? "the healthcare proxy"} can add or remove
            medications. You pay for the service;{" "}
            {agent ? agent.name.split(" ")[0] : "they"} hold
            {agent ? "s" : ""} {name}&apos;s healthcare proxy.
          </LockNote>
        </div>
      ) : null}

      {account.medications.length === 0 ? (
        <Card>
          <p className="text-[15px] leading-relaxed text-ink">
            No medications yet.
          </p>
          <p className="mt-1 text-[14px] leading-relaxed text-muted">
            Add what {name} takes and when. You can scan the bottle label to
            save typing.
          </p>
        </Card>
      ) : null}

      {scheduled.length > 0 ? (
        <div className="mb-8">
          <SectionTitle>Scheduled</SectionTitle>
          <div className="space-y-3">
            {scheduled.map((m) => (
              <MedRow
                key={m.id}
                account={account}
                med={m}
                nowHour={nowHour}
                canEdit={canEdit}
                onRemove={() => remove(m.id)}
              />
            ))}
          </div>
        </div>
      ) : null}

      {asNeeded.length > 0 ? (
        <div className="mb-8">
          <SectionTitle>As needed</SectionTitle>
          <div className="space-y-3">
            {asNeeded.map((m) => (
              <MedRow
                key={m.id}
                account={account}
                med={m}
                nowHour={nowHour}
                canEdit={canEdit}
                onRemove={() => remove(m.id)}
              />
            ))}
          </div>
        </div>
      ) : null}

      {canEdit ? (
        <div className="mt-4">
          <Button full onClick={() => setAdding(true)}>
            Add a medication
          </Button>
        </div>
      ) : null}

      {/* MED-003: today only. No history, streaks or percentages, by design. */}
      <p className="mt-6 text-[13px] leading-relaxed text-faint">
        We show whether {name} confirmed today&apos;s reminders. We don&apos;t
        keep score of past days.
      </p>

      {/* Prototype shortcut, not product. Stands in for her pressing 1 on the call. */}
      {!off && pending ? (
        <div className="mt-6 rounded-xl border border-dashed border-line p-3">
          <p className="mb-2 text-[12px] font-medium uppercase tracking-wider text-faint">
            Prototype shortcut
          </p>
          <button
            type="button"
            className="rounded-lg border border-line px-3 py-1.5 text-[13px] text-muted hover:text-ink"
            onClick={() =>
              update((d) => acknowledgeMed(d, pending.med.id, pending.hour))
            }
          >
            She confirmed the {formatHour(pending.hour)} {pending.med.name}
          </button>
        </div>
      ) : null}

      <AddMedSheet
        open={adding}
        onClose={() => setAdding(false)}
        parentName={name}
        onSave={(med) =>
          update((d) => {
            d.medications = [...d.medications, med];
            return d;
          })
        }
      />
    </AppShell>
  );
}
