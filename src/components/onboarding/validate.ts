import type { Draft } from "@/lib/onboardingDraft";

/**
 * Per-step validation. Each returns a map of field key -> message; an empty
 * map means the step can advance. Messages are shown only after the family
 * has tried to continue, never while they are still typing.
 */
export type Errors = Partial<Record<string, string>>;

const digits = (s: string) => s.replace(/\D/g, "");
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function phoneError(value: string, who: string): string | undefined {
  const n = digits(value);
  if (n.length === 0) return `Add ${who} phone number.`;
  if (n.length === 10 || (n.length === 11 && n.startsWith("1")))
    return undefined;
  return "That doesn't look like a US phone number. Use 10 digits, area code first.";
}

function emailError(value: string, who: string): string | undefined {
  if (!value.trim()) return `Add ${who} email.`;
  if (!EMAIL.test(value.trim()))
    return "That email address doesn't look right.";
  return undefined;
}

function clean(e: Errors): Errors {
  return Object.fromEntries(Object.entries(e).filter(([, v]) => v));
}

const name = (s: string, msg: string) =>
  s.trim().length > 1 ? undefined : msg;

export const VALIDATORS: Record<string, (d: Draft) => Errors> = {
  you: (d) =>
    clean({
      "you.name": name(d.you.name, "Add your name."),
      "you.email": emailError(d.you.email, "your"),
      "you.phone": phoneError(d.you.phone, "your"),
    }),
  parent: (d) =>
    clean({
      "parent.preferredName": d.parent.preferredName.trim()
        ? undefined
        : "Tell us what you call her.",
      "parent.phone": phoneError(d.parent.phone, "her"),
    }),
  agent: (d) =>
    d.agent.iAmTheAgent === null
      ? { "agent.choice": "Choose one to continue." }
      : d.agent.iAmTheAgent
        ? {}
        : clean({
            "agent.name": name(d.agent.name, "Add their name."),
            "agent.email": emailError(d.agent.email, "their"),
          }),
  window: () => ({}),
  emergency: (d) =>
    clean({
      "emergency.name": name(d.emergency.name, "Add a name."),
      "emergency.phone": phoneError(d.emergency.phone, "their"),
    }),
  "normal-day": (d) =>
    d.normalDay.tags.length > 0 || d.normalDay.notes.trim()
      ? {}
      : {
          "normalDay.any":
            "Pick at least one, or write a line about her. The person who calls needs something to go on.",
        },
  payment: (d) => {
    const card = digits(d.payment.cardNumber);
    const [mm, yy] = d.payment.expiry.split("/").map((s) => s.trim());
    const month = Number(mm);
    return clean({
      "payment.cardNumber":
        card.length >= 13 && card.length <= 19
          ? undefined
          : "Enter the full card number.",
      "payment.expiry":
        month >= 1 && month <= 12 && /^\d{2}$/.test(yy ?? "")
          ? undefined
          : "Use MM / YY.",
      "payment.cvc": /^\d{3,4}$/.test(d.payment.cvc.trim())
        ? undefined
        : "3 or 4 digits.",
      "payment.zip": /^\d{5}$/.test(d.payment.zip.trim())
        ? undefined
        : "5-digit ZIP.",
    });
  },
};

/** "4242424242424242" -> "4242 4242 4242 4242" as she types. */
export function formatCard(v: string): string {
  return digits(v)
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, "$1 ");
}

/** "0929" -> "09 / 29" as she types; deleting past the slash still works. */
export function formatExpiry(v: string, prev: string): string {
  const n = digits(v).slice(0, 4);
  if (v.length < prev.length && prev.endsWith(" / ") && n.length === 2)
    return n.slice(0, 1);
  if (n.length >= 3) return `${n.slice(0, 2)} / ${n.slice(2)}`;
  if (n.length === 2 && v.length > prev.length) return `${n} / `;
  return n;
}
