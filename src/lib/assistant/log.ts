import type { Account, AssistantConversation } from "../types";

/**
 * The assistant's close-out record (family-ai-assistant.md, "Z"). Stores what
 * kind of question was asked and where it went, never what was said.
 */
function find(account: Account, id: string): AssistantConversation | undefined {
  return (account.assistantLog ?? []).find((c) => c.id === id);
}

export function logTurn(account: Account, id: string, intent: string): Account {
  const at = new Date().toISOString();
  const c = find(account, id);
  if (c) {
    c.turns += 1;
    c.lastAt = at;
    if (!c.intents.includes(intent)) c.intents.push(intent);
    return account;
  }
  account.assistantLog = [
    {
      id,
      memberId: account.currentMemberId,
      startedAt: at,
      lastAt: at,
      turns: 1,
      intents: [intent],
    },
    ...(account.assistantLog ?? []),
  ];
  return account;
}

export function logHandoff(
  account: Account,
  id: string,
  to: NonNullable<AssistantConversation["handedTo"]>,
): Account {
  const c = find(account, id);
  if (c && c.handedTo !== "emergency") c.handedTo = to;
  return account;
}

export function closeConversation(account: Account, id: string): Account {
  const c = find(account, id);
  if (c && !c.endedAt) c.endedAt = new Date().toISOString();
  return account;
}
