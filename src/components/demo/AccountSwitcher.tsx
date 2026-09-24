"use client";

import { Card, Pill, SectionTitle } from "@/components/ui";
import { acceptInvite, joinAsMember } from "@/lib/actions";
import { roleLabel } from "@/lib/permissions";
import { useAccount } from "@/lib/store";

/**
 * Same account, different person: shows AUT-001's read-only state. Pending
 * invites can be accepted here, standing in for the invitee's own email link.
 */
export function AccountSwitcher() {
  const { account, update } = useAccount();
  if (!account) return null;
  const { invites } = account;
  if (account.members.length < 2 && invites.length === 0) return null;

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
              onClick={() =>
                update((d) => {
                  // Signing in as someone still invited is them accepting.
                  joinAsMember(d, m.id);
                  d.currentMemberId = m.id;
                  return d;
                })
              }
              className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left ${
                account.currentMemberId === m.id
                  ? "border-sage bg-sage-soft"
                  : "border-line bg-surface hover:border-sage/40"
              }`}
            >
              <span className="text-[14px] font-medium text-ink">
                {m.pending ? `Accept as ${m.name}` : m.name}
              </span>
              <Pill tone={m.isAuthorizedAgent ? "sage" : "neutral"}>
                {roleLabel(m)}
              </Pill>
            </button>
          ))}
          {invites.map((i) => (
            <button
              key={i.id}
              type="button"
              onClick={() =>
                update((d) => {
                  const joined = acceptInvite(d, i.id);
                  joined.currentMemberId =
                    joined.members[joined.members.length - 1].id;
                  return joined;
                })
              }
              className="flex w-full items-center justify-between rounded-xl border border-dashed border-line bg-surface px-4 py-3 text-left hover:border-sage/40"
            >
              <span className="text-[14px] font-medium text-ink">
                Accept as {i.name}
              </span>
              <Pill tone="amber">Invited</Pill>
            </button>
          ))}
        </div>
      </Card>
    </section>
  );
}
