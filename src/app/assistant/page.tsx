"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { Chat } from "@/components/assistant/Chat";
import { useAccount } from "@/lib/store";

/**
 * "Ask" tab: the Family AI Assistant (docs/sources/family-ai-assistant.md).
 * Scripted, deterministic answers from the live account. No model, no network.
 */
export default function AssistantPage() {
  const router = useRouter();
  const { account, ready } = useAccount();

  useEffect(() => {
    if (ready && !account) router.replace("/");
  }, [ready, account, router]);

  if (!ready || !account) return null;

  return (
    <AppShell>
      {/* A new family, member or demo reset starts a fresh conversation. */}
      <Chat
        key={`${account.id}:${account.createdAt}:${account.currentMemberId}`}
        account={account}
      />
    </AppShell>
  );
}
