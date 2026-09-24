"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { DeceasedState, ReportDeath } from "@/components/profile/Bereavement";
import { CareInstructions } from "@/components/profile/CareInstructions";
import { ConsentCard } from "@/components/profile/ConsentCard";
import { CareTeam, Members } from "@/components/profile/People";
import { QuietHours } from "@/components/profile/QuietHours";
import { Subscription } from "@/components/profile/Subscription";
import { useAccount } from "@/lib/store";
import { timezoneLabel } from "@/lib/timezones";

export default function ProfilePage() {
  const router = useRouter();
  const { account, ready } = useAccount();

  useEffect(() => {
    if (ready && !account) router.replace("/");
  }, [ready, account, router]);

  if (!ready || !account) return null;

  const { parent } = account;

  return (
    <AppShell>
      <h1 className="font-serif text-[28px] leading-tight text-ink">
        {parent.fullName}
      </h1>
      <p className="mt-1 text-[15px] text-muted">
        Goes by {parent.preferredName} · {timezoneLabel(parent.parentTimezone)}
      </p>

      {/* BIL-002: after a death there is nothing left to edit, pause or cancel. */}
      {account.deceasedAt ? (
        <>
          <DeceasedState account={account} />
          <CareTeam account={account} />
          <Members account={account} />
        </>
      ) : (
        <>
          <ConsentCard account={account} />
          <CareTeam account={account} />
          <CareInstructions account={account} />
          <Members account={account} />
          <QuietHours account={account} />
          <Subscription account={account} />
          <ReportDeath account={account} />
        </>
      )}
    </AppShell>
  );
}
