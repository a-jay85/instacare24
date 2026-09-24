"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { DeceasedState, ReportDeath } from "@/components/profile/Bereavement";
import { CareInstructions } from "@/components/profile/CareInstructions";
import { Cancelled } from "@/components/profile/Cancelled";
import { ConsentCard } from "@/components/profile/ConsentCard";
import { CareTeam, Members } from "@/components/profile/People";
import { QuietHours } from "@/components/profile/QuietHours";
import { Subscription, cancelReceipt } from "@/components/profile/Subscription";
import { useAccount } from "@/lib/store";
import { timezoneLabel } from "@/lib/timezones";

export default function ProfilePage() {
  const router = useRouter();
  const { account, ready } = useAccount();

  // BIL-001: straight after a cancel, show the receipt rather than bouncing.
  const receipt = cancelReceipt.at;

  useEffect(() => {
    if (ready && !account && !receipt) router.replace("/");
  }, [ready, account, receipt, router]);

  if (ready && !account && receipt)
    return <Cancelled name={cancelReceipt.name} at={receipt} />;
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
