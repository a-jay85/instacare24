import type { Account, Member } from "./types";

export function currentMember(account: Account): Member | undefined {
  return account.members.find((m) => m.id === account.currentMemberId);
}

export function authorizedAgent(account: Account): Member | undefined {
  return account.members.find((m) => m.isAuthorizedAgent);
}

/**
 * AUT-004: several family members read, exactly one writes, and that one is
 * the authorized agent. Run on load and after any change to the member list,
 * so no path can leave two editors or an editor who is not the agent.
 */
export function enforceOneEditor(account: Account): Account {
  const agent = authorizedAgent(account);
  account.members = account.members.map((m) => ({
    ...m,
    isAuthorizedAgent: m.id === agent?.id,
    accessLevel: m.id === agent?.id ? "write" : "read",
  }));
  return account;
}

export function payer(account: Account): Member | undefined {
  return account.members.find((m) => m.isPayer);
}

/**
 * AUT-001: "the payer alone cannot change care instructions."
 * Care instructions are the check-in window, the emergency contact and the
 * normal-day description -- everything that changes what happens to the parent.
 */
export function canEditCareInstructions(account: Account): boolean {
  const me = currentMember(account);
  return Boolean(me?.isAuthorizedAgent && me.accessLevel === "write");
}

/** BIL-001: the card and the cancel button follow the money, not the POA. */
export function canManageBilling(account: Account): boolean {
  return Boolean(currentMember(account)?.isPayer);
}

export function roleLabel(member: Member): string {
  if (member.isPayer && member.isAuthorizedAgent) return "Pays · Decides";
  if (member.isAuthorizedAgent) return "Decides";
  if (member.isPayer) return "Pays";
  return "Can view";
}
