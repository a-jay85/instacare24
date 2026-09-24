"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { DoctorTeaser } from "@/components/feed/DoctorTeaser";
import { EscalationCard } from "@/components/feed/EscalationCard";
import { HistoryList } from "@/components/feed/HistoryList";
import { TodayHero } from "@/components/feed/TodayHero";
import { TodayReminders } from "@/components/feed/TodayReminders";
import { useAccount } from "@/lib/store";
import { timezoneLabel } from "@/lib/timezones";

/**
 * The screen retention is decided on. Everything reads from the shared store,
 * so a call logged in the staff console lands here without a reload.
 */
export default function FeedPage() {
  const router = useRouter();
  const { account, ready } = useAccount();

  useEffect(() => {
    if (ready && !account) router.replace("/");
  }, [ready, account, router]);

  if (!ready || !account) return null;

  const { parent } = account;

  return (
    <AppShell>
      <p className="text-[13px] font-medium text-faint">
        {parent.preferredName} · {timezoneLabel(parent.parentTimezone)}
      </p>

      {/* FEED-001: today's state is legible without scrolling and without interpreting. */}
      <TodayHero account={account} />

      {/* BIL-002: after a death, nothing else on this screen is appropriate. */}
      {account.deceasedAt ? null : (
        <>
          <EscalationCard account={account} />
          <TodayReminders account={account} />
          <DoctorTeaser account={account} />
          <HistoryList records={account.checkIns} />
        </>
      )}
    </AppShell>
  );
}
