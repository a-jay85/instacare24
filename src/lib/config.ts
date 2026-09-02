/**
 * CHN-001 is BLOCKED in the v1 scope sheet: voice / SMS / app / in-home device,
 * not decided.
 *
 * The prototype assumes VOICE, because CHN-002 requires a check-in that needs
 * no setup action from the parent ("no new device and no app install"). SMS
 * assumes she reads and replies to texts; app and device both require an
 * install. A call to the phone she already owns is the only option that clears
 * that bar today.
 *
 * Everything channel-shaped in the UI reads from here, so swapping the decision
 * later is a one-line edit plus copy in CHANNEL_COPY.
 */
export type ParentChannel = "voice" | "sms" | "app" | "device";

export const PARENT_CHANNEL: ParentChannel = "voice";

export const CHANNEL_COPY: Record<
  ParentChannel,
  { noun: string; verb: string; contactLabel: string; contactHint: string }
> = {
  voice: {
    noun: "phone call",
    verb: "call",
    contactLabel: "Her phone number",
    contactHint: "The number she already answers. A landline is fine.",
  },
  sms: {
    noun: "text message",
    verb: "text",
    contactLabel: "Her mobile number",
    contactHint: "Must be a mobile that can receive texts.",
  },
  app: {
    noun: "app check-in",
    verb: "check in with",
    contactLabel: "Her mobile number",
    contactHint: "Used to send her the app invitation.",
  },
  device: {
    noun: "device check-in",
    verb: "check in with",
    contactLabel: "Her phone number",
    contactHint: "Used only if the in-home device is unreachable.",
  },
};

export const PRICE_MONTHLY = 69;

/** Configurable values table, v1 scope sheet. */
export const CHECK_IN = {
  /** Any 2-hour window between 07:00 and 19:00, parent-local. */
  earliestStartHour: 7,
  latestEndHour: 19,
  windowLengthHours: 2,
  defaultStartHour: 9,
};

export const QUIET_HOURS_DEFAULT = { startHour: 21, endHour: 7 };

/** ONB-001: median sign-up to first scheduled check-in, under 15 minutes. */
export const ONBOARDING_TARGET_MINUTES = 15;

/** AUT-002: how long we tell the family the consent call may take. */
export const CONSENT_CALL_SLA_HOURS = 24;
