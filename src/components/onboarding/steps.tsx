import type { ReactNode } from "react";
import type { Draft } from "@/lib/onboardingDraft";
import { hersName, herName, type StepProps } from "./parts";
import { StepAgent, StepEmergency, StepParent, StepYou } from "./stepsPeople";
import { StepNormalDay, StepPayment, StepWindow } from "./stepsPlan";

export type Step = {
  id: string;
  title: (d: Draft) => string;
  subtitle: (d: Draft) => string;
  render: (p: StepProps) => ReactNode;
  cta?: string;
};

/**
 * ONB-001: median sign-up to first scheduled check-in under 15 minutes.
 * Seven steps, one idea each. Every field here is named in ONB-002, or is
 * required by AUT-001 (the agent) or BIL-001 (the card).
 * Validation lives in ./validate.ts, keyed by step id.
 */
export const STEPS: Step[] = [
  {
    id: "you",
    title: () => "First, who are you?",
    subtitle: () => "You are the one we keep informed.",
    render: (p) => <StepYou {...p} />,
  },
  {
    id: "parent",
    title: () => "Who are we checking on?",
    subtitle: () => "The person we'll call every day, once she has said yes.",
    render: (p) => <StepParent {...p} />,
  },
  {
    id: "agent",
    title: (d) => `Who legally decides for ${herName(d)}?`,
    subtitle: () =>
      "Paying for the service and holding the power to decide are two different things, so we keep them apart.",
    render: (p) => <StepAgent {...p} />,
  },
  {
    id: "window",
    title: (d) => `When should we call ${herName(d)}?`,
    subtitle: () => "Pick a two-hour window. We will call inside it.",
    render: (p) => <StepWindow {...p} />,
  },
  {
    id: "emergency",
    title: () => "Who is nearby?",
    subtitle: (d) =>
      `One emergency contact, close enough to knock on ${hersName(d)} door.`,
    render: (p) => <StepEmergency {...p} />,
  },
  {
    id: "normal-day",
    title: (d) => `What does a normal day look like for ${herName(d)}?`,
    subtitle: () =>
      "This is how we notice when something is off. It is also how we sound like we know her.",
    render: (p) => <StepNormalDay {...p} />,
  },
  {
    id: "payment",
    title: () => "Last thing.",
    subtitle: () => "One price. Cancel from the app, any time.",
    render: (p) => <StepPayment {...p} />,
    cta: "Start the service",
  },
];
