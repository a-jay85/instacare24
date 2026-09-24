"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ConnectInsurance } from "@/components/insurance/ConnectInsurance";
import { EobList } from "@/components/insurance/EobList";
import { EobSheet } from "@/components/insurance/EobSheet";
import {
  BackLink,
  Button,
  Card,
  PageTitle,
  SectionTitle,
  money,
} from "@/components/ui";
import { openEscalation } from "@/lib/actions";
import { appealTitle } from "@/lib/insurance";
import { authorizedAgent, currentMember } from "@/lib/permissions";
import { useAccount } from "@/lib/store";
import type { Eob } from "@/lib/types";

export default function InsurancePage() {
  const router = useRouter();
  const { account, ready, update } = useAccount();
  const [openId, setOpenId] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    if (ready && !account) router.replace("/");
  }, [ready, account, router]);

  if (!ready || !account) return null;

  const { parent, insurance } = account;
  const name = parent.preferredName;
  const me = currentMember(account);
  const agent = authorizedAgent(account);
  const open = account.eobs.find((e) => e.id === openId) ?? null;

  // Family AI assistant access rules: say out loud why this person can see it.
  const accessLine =
    me && agent && me.id === agent.id
      ? `You see this as ${name}'s healthcare proxy.`
      : `Shared with you because ${agent ? agent.name.split(" ")[0] : "her healthcare proxy"} allowed it.`;

  const appeal = (eob: Eob) =>
    update((d) =>
      openEscalation(d, {
        source: "family_request",
        title: appealTitle(d, eob),
        detail: `${eob.provider}, ${eob.date}. Billed ${money(eob.billed)}, plan paid ${money(eob.planPaid)}, she is being asked for ${money(eob.youOwe)}.${eob.flags.length ? ` Flags: ${eob.flags.join("; ")}.` : ""} Family asked the Care Specialist to appeal.`,
        by: me?.name ?? "The family",
      }),
    );

  return (
    <AppShell>
      <BackLink href="/care" label="Care" />
      <PageTitle
        title="Insurance"
        subtitle={`${name}'s plan, and what each letter from it means for her.`}
      />

      {insurance ? (
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[13px] font-medium text-faint">
                {parent.fullName}
              </p>
              <p className="mt-1 font-serif text-[22px] leading-tight text-ink">
                {insurance.carrier}
              </p>
              <p className="mt-0.5 text-[15px] text-muted">{insurance.plan}</p>
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between gap-4">
            <span className="text-[14px] text-muted">Member ID</span>
            <span className="text-[15px] font-medium tracking-wide text-ink">
              {insurance.memberId}
            </span>
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-[13px] text-moss">
            <span aria-hidden className="h-2 w-2 rounded-full bg-moss" />
            {insurance.connectedVia === "portal"
              ? "Connected via patient portal"
              : "Added from a photo of the card"}
          </p>
          {me?.accessLevel === "read" ? null : disconnecting ? (
            <div className="mt-4 border-t border-line pt-4">
              <p className="text-[14px] leading-relaxed text-ink">
                {insurance.connectedVia === "portal"
                  ? "We stop reading her portal. New letters stop arriving here."
                  : "We remove her plan. New letters stop arriving here."}{" "}
                Letters already here stay.
              </p>
              <div className="mt-3 flex gap-2">
                <Button
                  variant="danger"
                  onClick={() => {
                    update((d) => {
                      delete d.insurance;
                      return d;
                    });
                    setDisconnecting(false);
                  }}
                >
                  {insurance.connectedVia === "portal"
                    ? "Disconnect"
                    : "Remove"}
                </Button>
                <Button variant="ghost" onClick={() => setDisconnecting(false)}>
                  Keep it
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setDisconnecting(true)}
              className="mt-3 min-h-11 text-[14px] font-medium text-muted hover:text-ink"
            >
              {insurance.connectedVia === "portal"
                ? "Disconnect the portal"
                : "Remove this plan"}
            </button>
          )}
        </Card>
      ) : (
        <ConnectInsurance
          parentName={name}
          onSave={(ins) =>
            update((d) => {
              d.insurance = ins;
              return d;
            })
          }
        />
      )}

      <p className="mt-3 text-[13px] leading-snug text-faint">{accessLine}</p>

      <div className="mt-8">
        <SectionTitle>Explanation of Benefits</SectionTitle>
        <p className="-mt-1 mb-4 text-[14px] leading-relaxed text-muted">
          The letter the insurer sends after each visit. We read it so you
          don&apos;t have to.
        </p>
        {account.eobs.length > 0 ? (
          <EobList account={account} onOpen={setOpenId} />
        ) : (
          <Card>
            <p className="text-[15px] leading-relaxed text-ink">
              No letters yet.
            </p>
            <p className="mt-1 text-[14px] leading-relaxed text-muted">
              {insurance
                ? `They usually arrive two to four weeks after a visit. We will tell you what each one means for ${name}.`
                : `Once her plan is connected, each letter shows up here with what it means for ${name}.`}
            </p>
          </Card>
        )}
      </div>

      <EobSheet
        account={account}
        eob={open}
        onClose={() => setOpenId(null)}
        onAppeal={appeal}
      />
    </AppShell>
  );
}
