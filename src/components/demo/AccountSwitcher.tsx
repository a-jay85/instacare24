"use client";

import { Card, Pill, SectionTitle } from "@/components/ui";
import { roleLabel } from "@/lib/permissions";
import { useAccount } from "@/lib/store";

/** Same account, different person: shows AUT-001's read-only state. */
export function AccountSwitcher() {
  const { account, update } = useAccount();
  if (!account || account.members.length < 2) return null;

  return (
    <section>
      <SectionTitle>Signed in as</SectionTitle>
      <Card>
        <p className="mb-3 text-[13px] leading-relaxed text-muted">
          Switch people to watch care instructions and medications flip between
          editable and read-only.
        </p>
        <div className="space-y-2">
          {account.members.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={account.currentMemberId === m.id}
              onClick={() => update((d) => ((d.currentMemberId = m.id), d))}
              className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left ${
                account.currentMemberId === m.id
                  ? "border-sage bg-sage-soft"
                  : "border-line bg-surface hover:border-sage/40"
              }`}
            >
              <span className="text-[14px] font-medium text-ink">{m.name}</span>
              <Pill tone={m.isAuthorizedAgent ? "sage" : "neutral"}>
                {roleLabel(m)}
              </Pill>
            </button>
          ))}
        </div>
      </Card>
    </section>
  );
}
