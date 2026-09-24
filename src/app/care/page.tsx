"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { CareTeamCard } from "@/components/care/CareTeamCard";
import {
  DOCTOR_ICON,
  HubCard,
  PILL_ICON,
  SHIELD_ICON,
} from "@/components/care/HubCard";
import { PageTitle, Pill, SectionTitle } from "@/components/ui";
import { claimsNeedingAttention, shortDate } from "@/lib/insurance";
import {
  asNeededMeds,
  nextReminder,
  parentHourNow,
  remindersOff,
} from "@/lib/meds";
import { CHANNEL_COPY } from "@/lib/config";
import { useAccount } from "@/lib/store";
import { formatHour } from "@/lib/timezones";
import { doctorInline } from "@/lib/visits";

export default function CareHubPage() {
  const router = useRouter();
  const { account, ready } = useAccount();

  useEffect(() => {
    if (ready && !account) router.replace("/");
  }, [ready, account, router]);

  if (!ready || !account) return null;

  const { parent } = account;
  const name = parent.preferredName;

  // Medications
  const medCount = account.medications.length;
  const asNeeded = asNeededMeds(account).length;
  const off = remindersOff(account);
  const next = nextReminder(account, parentHourNow(parent.parentTimezone));
  const medHeadline =
    medCount === 0
      ? "No medications added yet."
      : `${medCount} medication${medCount === 1 ? "" : "s"}${asNeeded ? `, ${asNeeded} as needed` : ""}.`;
  const medDetail =
    medCount === 0
      ? `Add them and we remind her on her daily ${CHANNEL_COPY[parent.channel].noun}.`
      : off === "pending"
        ? `Reminders start once ${name} agrees to the calls.`
        : off
          ? "Reminders have stopped."
          : next
            ? `Next reminder today: ${formatHour(next.hour)} · ${next.meds.map((m) => m.name).join(", ")}`
            : "No more reminders today.";

  // Visits
  const latest = [...account.visits].sort((a, b) =>
    b.date.localeCompare(a.date),
  )[0];

  // Insurance
  const attention = claimsNeedingAttention(account).length;
  const insuranceHeadline = !account.insurance
    ? "Not connected yet."
    : attention > 0
      ? `${attention} claim${attention === 1 ? "" : "s"} need${attention === 1 ? "s" : ""} attention.`
      : account.eobs.length > 0
        ? "Nothing needs you right now."
        : "No insurance letters yet.";

  return (
    <AppShell>
      <PageTitle
        title={`${name}'s care`}
        subtitle="Her medicines, her doctor visits and her insurance letters, in one place."
      />

      <div className="space-y-3">
        <HubCard
          href="/care/medications"
          title="Medications"
          icon={PILL_ICON}
          headline={medHeadline}
          detail={medDetail}
        />
        <HubCard
          href="/care/visits"
          title="Doctor visits"
          icon={DOCTOR_ICON}
          headline={
            latest
              ? `Last visit ${shortDate(latest.date)} with ${doctorInline(latest)}.`
              : "No visits added yet."
          }
          detail={
            latest
              ? `${latest.specialty}. Summary in plain English.`
              : "Record a visit or photograph the paperwork. We write it up in plain English."
          }
          badge={
            latest?.status === "pending_review" ? (
              <Pill tone="amber">Being checked</Pill>
            ) : null
          }
        />
        <HubCard
          href="/care/insurance"
          title="Insurance"
          icon={SHIELD_ICON}
          headline={insuranceHeadline}
          detail={
            account.insurance
              ? `${account.insurance.carrier} · ${account.insurance.plan}`
              : "Connect her plan and we read every letter the insurer sends."
          }
          badge={
            attention > 0 ? <Pill tone="clay">Needs attention</Pill> : null
          }
        />
      </div>

      <div className="mt-8">
        <SectionTitle>Who looks after her</SectionTitle>
        <CareTeamCard account={account} />
      </div>
    </AppShell>
  );
}
