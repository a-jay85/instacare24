import { currentMember } from "../permissions";
import type { Account, Eob } from "../types";
import { callback } from "./answers-day";
import { firstName, stamp, usd as money } from "./format";
import type { Reply, ReplyAction, Source } from "./types";

/** Scripted answers for insurance and EOBs. No model, no network. */

const INSURANCE_LINK: ReplyAction = {
  kind: "link",
  label: "Open insurance",
  href: "/care/insurance",
};

const EOB_EXPLAINED =
  "An EOB (explanation of benefits) is the plan's note of what it paid. It is not a bill, but it tells you what the bill should say.";

function eobSource(account: Account, eobs: Eob[]): Source {
  const latest = [...eobs].sort((a, b) => b.date.localeCompare(a.date))[0];
  return {
    module: `${account.insurance?.carrier ?? "Insurance"} EOBs, plain-English by AI`,
    at: latest?.date,
    verification: "ai_generated",
  };
}

function appealAction(account: Account, question: string): ReplyAction {
  const me = currentMember(account)?.name ?? "The family";
  return {
    kind: "callback",
    label: `Ask ${firstName(account.careTeam.specialistName)} about the appeal`,
    note: `${firstName(me)} asked the assistant: "${question}". Wants help with the denied claim.`,
  };
}

/**
 * Spec E, "Data Available? No": say the information is unavailable, offer to
 * retry by connecting it, and offer a person.
 */
function noInsurance(account: Account, question = ""): Reply {
  return {
    intent: "insurance",
    tone: "default",
    body: [
      `That information isn't available: no insurance is connected for ${account.parent.preferredName} yet.`,
      `Connect it and ask again, or ${firstName(account.careTeam.specialistName)} can help by phone.`,
    ],
    actions: [INSURANCE_LINK, callback(account, question)],
  };
}

export function oweReply(account: Account, question: string): Reply {
  if (!account.insurance && account.eobs.length === 0)
    return noInsurance(account, question);
  const name = account.parent.preferredName;
  const owed = account.eobs.filter(
    (e) => e.status === "processed" && e.youOwe > 0,
  );
  const denied = account.eobs.filter((e) => e.status === "denied");
  const total = owed.reduce((s, e) => s + e.youOwe, 0);

  const body = [
    owed.length
      ? `${name}'s share comes to ${money(total)} across ${owed.length} ${owed.length === 1 ? "claim" : "claims"}.`
      : `${name} doesn't owe anything on processed claims.`,
  ];
  for (const d of denied)
    body.push(
      `Separately, the ${money(d.youOwe)} for ${d.service.toLowerCase()} was denied. Don't count it yet: ${d.plain}`,
    );
  body.push(EOB_EXPLAINED);

  return {
    intent: "insurance_owe",
    tone: "default",
    body,
    items: owed.map(
      (e) =>
        `${money(e.youOwe)}: ${e.service}, ${e.provider}, ${stamp(e.date)}. ${e.plain}`,
    ),
    sources: [eobSource(account, account.eobs)],
    actions: denied.length
      ? [INSURANCE_LINK, appealAction(account, question)]
      : [INSURANCE_LINK],
    suggestions: denied.length ? ["Why was a claim denied?"] : undefined,
  };
}

export function deniedReply(account: Account, question: string): Reply {
  if (!account.insurance && account.eobs.length === 0)
    return noInsurance(account, question);
  const denied = account.eobs.filter((e) => e.status === "denied");
  if (denied.length === 0) {
    return {
      intent: "insurance_denied",
      tone: "default",
      body: [
        `No claims have been denied for ${account.parent.preferredName}.`,
        "Prior authorization means the plan wants to approve some services before they happen.",
      ],
      actions: [INSURANCE_LINK],
    };
  }
  const body: string[] = [];
  for (const d of denied)
    body.push(
      `${d.provider} billed ${money(d.billed)} for ${d.service.toLowerCase()} on ${stamp(d.date)}, and the plan paid nothing. ${d.plain}`,
    );
  body.push(
    "Prior authorization means the plan wanted to approve this before it happened. Nobody asked, so it said no.",
  );
  return {
    intent: "insurance_denied",
    tone: "default",
    body,
    items: denied.flatMap((d) => d.flags),
    sources: [eobSource(account, denied)],
    actions: [appealAction(account, question), INSURANCE_LINK],
  };
}

export function insuranceReply(account: Account, question = ""): Reply {
  const ins = account.insurance;
  if (!ins) return noInsurance(account, question);
  const name = account.parent.preferredName;
  const denied = account.eobs.filter((e) => e.status === "denied").length;
  const pending = account.eobs.filter((e) => e.status === "pending").length;
  const body = [
    `${name} is on ${ins.carrier} ${ins.plan}, member ID ending ${ins.memberId.slice(-4)}. Connected through ${ins.connectedVia === "portal" ? "the plan's portal" : "a photo of her card"}.`,
    `${account.eobs.length} EOBs on file${denied ? `, ${denied} denied` : ""}${pending ? `, ${pending} still pending` : ""}.`,
  ];
  // "What's an EOB?" gets the definition first, not last.
  if (/\b(eob|explanation of benefits)\b/i.test(question))
    body.unshift(EOB_EXPLAINED);
  else body.push(EOB_EXPLAINED);
  return {
    intent: "insurance",
    tone: "default",
    body,
    sources: [
      {
        module: `${ins.carrier} ${ins.connectedVia === "portal" ? "portal" : "card photo"}`,
        verification: "record",
      },
    ],
    actions: [INSURANCE_LINK],
    suggestions: [
      "What do we owe?",
      ...(denied ? ["Why was a claim denied?"] : []),
    ],
  };
}
