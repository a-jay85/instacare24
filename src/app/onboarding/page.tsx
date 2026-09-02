"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { TalkToSomeone } from "@/components/TalkToSomeone";
import {
  StepAgent,
  StepDone,
  StepEmergency,
  StepNormalDay,
  StepParent,
  StepPayment,
  StepWindow,
  StepYou,
} from "@/components/onboarding/steps";
import { draftToAccount, emptyDraft, type Draft } from "@/lib/onboardingDraft";
import { useAccount } from "@/lib/store";

type Step = {
  id: string;
  title: (d: Draft) => string;
  subtitle: (d: Draft) => string;
  render: (p: { draft: Draft; set: (patch: (d: Draft) => void) => void }) => React.ReactNode;
  isValid: (d: Draft) => boolean;
  cta?: string;
};

const her = (d: Draft) => d.parent.preferredName.trim() || "her";

/**
 * ONB-001: median sign-up to first scheduled check-in under 15 minutes.
 * Seven steps, one idea each. Every field here is named in ONB-002, or is
 * required by AUT-001 (the agent) or BIL-001 (the card).
 */
const STEPS: Step[] = [
  {
    id: "you",
    title: () => "First, who are you?",
    subtitle: () => "You are the one we keep informed.",
    render: (p) => <StepYou {...p} />,
    isValid: (d) => d.you.name.trim().length > 1 && d.you.email.includes("@"),
  },
  {
    id: "parent",
    title: () => "Who are we checking on?",
    subtitle: () => "She does not need to do anything to set this up.",
    render: (p) => <StepParent {...p} />,
    isValid: (d) =>
      d.parent.preferredName.trim().length > 0 &&
      d.parent.phone.replace(/\D/g, "").length >= 10,
  },
  {
    id: "agent",
    title: (d) => `Who legally decides for ${her(d)}?`,
    subtitle: () =>
      "Paying for the service and holding the power to decide are two different things, so we keep them apart.",
    render: (p) => <StepAgent {...p} />,
    isValid: (d) =>
      d.agent.iAmTheAgent === true ||
      (d.agent.iAmTheAgent === false && d.agent.name.trim().length > 1),
  },
  {
    id: "window",
    title: (d) => `When should we call ${her(d)}?`,
    subtitle: () => "Pick a two-hour window. We will land inside it.",
    render: (p) => <StepWindow {...p} />,
    isValid: () => true,
  },
  {
    id: "emergency",
    title: () => "Who is nearby?",
    subtitle: () => "One emergency contact, close enough to knock on the door.",
    render: (p) => <StepEmergency {...p} />,
    isValid: (d) =>
      d.emergency.name.trim().length > 1 &&
      d.emergency.phone.replace(/\D/g, "").length >= 10,
  },
  {
    id: "normal-day",
    title: (d) => `What does a normal day look like for ${her(d)}?`,
    subtitle: () =>
      "This is how we notice when something is off. It is also how we sound like we know her.",
    render: (p) => <StepNormalDay {...p} />,
    isValid: (d) => d.normalDay.tags.length > 0 || d.normalDay.notes.trim().length > 0,
  },
  {
    id: "payment",
    title: () => "Last thing.",
    subtitle: () => "One price. Cancel in two taps, any time.",
    render: (p) => <StepPayment {...p} />,
    isValid: (d) => d.payment.cardNumber.replace(/\D/g, "").length >= 12,
    cta: "Start the service",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { save } = useAccount();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);

  const set = useCallback((patch: (d: Draft) => void) => {
    setDraft((prev) => {
      const next = structuredClone(prev);
      patch(next);
      return next;
    });
  }, []);

  const step = STEPS[index];
  const valid = useMemo(() => step.isValid(draft), [step, draft]);

  function next() {
    if (index === STEPS.length - 1) {
      save(draftToAccount(draft));
      setDone(true);
      return;
    }
    setIndex((i) => i + 1);
    window.scrollTo({ top: 0 });
  }

  function back() {
    setIndex((i) => Math.max(0, i - 1));
    window.scrollTo({ top: 0 });
  }

  if (done) {
    return (
      <div className="mx-auto min-h-dvh w-full max-w-lg px-5 pb-10">
        <header className="flex items-center justify-between py-5">
          <span className="font-serif text-lg font-semibold text-ink">
            InstaCare<span className="text-sage">24</span>
          </span>
          <TalkToSomeone variant="link" />
        </header>
        <StepDone draft={draft} onContinue={() => router.push("/feed")} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pb-6">
      <header className="flex items-center justify-between py-5">
        <Link href="/" className="font-serif text-lg font-semibold text-ink">
          InstaCare<span className="text-sage">24</span>
        </Link>
        <div className="flex items-center gap-4">
          <TalkToSomeone variant="link" />
          <span className="text-[13px] text-faint">
            {index + 1} / {STEPS.length}
          </span>
        </div>
      </header>

      <div className="mb-7 h-1 w-full overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-sage transition-all duration-300"
          style={{ width: `${((index + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      <h1 className="font-serif text-[28px] leading-tight text-ink">
        {step.title(draft)}
      </h1>
      <p className="mt-2 text-[15px] leading-relaxed text-muted">
        {step.subtitle(draft)}
      </p>

      <div className="mt-7 flex-1">{step.render({ draft, set })}</div>

      <div className="mt-8 flex items-center gap-3">
        {index > 0 ? (
          <Button variant="secondary" onClick={back}>
            Back
          </Button>
        ) : null}
        <div className="flex-1">
          <Button full onClick={next} disabled={!valid}>
            {step.cta ?? "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
