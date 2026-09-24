import { currentMember } from "./permissions";
import type { Account, Eob, EobAuditEntry, Insurance } from "./types";

/** Carriers offered in the scripted portal connect. */
export const CARRIERS: { id: string; name: string; plan: string }[] = [
  { id: "aetna", name: "Aetna", plan: "Medicare Advantage HMO" },
  {
    id: "bcbs",
    name: "Blue Cross Blue Shield",
    plan: "Medicare Advantage PPO",
  },
  { id: "uhc", name: "UnitedHealthcare", plan: "AARP Medicare Advantage" },
  { id: "humana", name: "Humana", plan: "Gold Plus HMO" },
  { id: "medicare", name: "Medicare", plan: "Original Medicare, Parts A & B" },
];

/**
 * Scripted: no portal or OCR is called. Each returns a plausible policy so the
 * demo can show the confirm step.
 */
export function fakePortalPolicy(carrierId: string): Insurance {
  const c = CARRIERS.find((x) => x.id === carrierId) ?? CARRIERS[0];
  return {
    carrier: c.name,
    plan: c.plan,
    memberId: `${c.id.toUpperCase()}-${Math.floor(10000 + Math.random() * 89999)}`,
    groupNumber: `GRP-${Math.floor(10000 + Math.random() * 89999)}`,
    connectedVia: "portal",
  };
}

export const SAMPLE_CARD_SCAN: Insurance = {
  carrier: "Humana",
  plan: "Gold Plus HMO",
  memberId: "H4471-20938",
  groupNumber: "GP-20931",
  connectedVia: "card_photo",
};

/**
 * insurance-eob.md: every view and share of a letter is written to its audit
 * log. Repeat views by the same person within a minute count once.
 */
export function logEobAccess(
  account: Account,
  eobId: string,
  action: EobAuditEntry["action"],
): Account {
  const actor = currentMember(account)?.name ?? "Unknown";
  const at = new Date().toISOString();
  const last = (account.eobAudit ?? []).find((e) => e.eobId === eobId);
  if (
    action === "view" &&
    last?.action === "view" &&
    last.actor === actor &&
    Date.parse(at) - Date.parse(last.at) < 60_000
  )
    return account;
  account.eobAudit = [
    { eobId, actor, action, at },
    ...(account.eobAudit ?? []),
  ];
  return account;
}

export function eobAuditFor(account: Account, eobId: string): EobAuditEntry[] {
  return (account.eobAudit ?? []).filter((e) => e.eobId === eobId);
}

export function shortDate(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/**
 * Stable, stand-alone title for the appeal escalation. The staff console reads
 * it without context, and we match on it to know an appeal is already asked.
 */
export function appealTitle(account: Account, eob: Eob): string {
  return `${account.parent.preferredName}'s claim was denied: ${eob.service} (${eob.provider}). Appeal requested`;
}

export function appealRequested(account: Account, eob: Eob): boolean {
  const title = appealTitle(account, eob);
  return account.escalations.some((e) => e.title === title);
}

/** Denied claims nobody has asked Dana to appeal yet. */
export function claimsNeedingAttention(account: Account): Eob[] {
  return account.eobs.filter(
    (e) => e.status === "denied" && !appealRequested(account, e),
  );
}

export const EOB_STATUS: Record<
  Eob["status"],
  { label: string; tone: "moss" | "clay" | "amber" }
> = {
  processed: { label: "Processed", tone: "moss" },
  denied: { label: "Denied", tone: "clay" },
  pending: { label: "Pending", tone: "amber" },
};
