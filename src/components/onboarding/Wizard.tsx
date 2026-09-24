"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";
import { scrollAppTop } from "@/components/shell/PhoneFrame";
import {
  clearDraft,
  draftHasContent,
  draftToAccount,
  emptyDraft,
  loadDraft,
  saveDraft,
  takeDraftFromLink,
  type Draft,
} from "@/lib/onboardingDraft";
import { useAccount } from "@/lib/store";
import { ContinueElsewhere } from "./ContinueElsewhere";
import { OnboardingHeader } from "./parts";
import { StepDone } from "./StepDone";
import { STEPS } from "./steps";
import { VALIDATORS } from "./validate";

const stepErrors = (i: number, d: Draft) => VALIDATORS[STEPS[i].id](d);

/**
 * Mounted only after the account store has read localStorage (client-only),
 * so the lazy initialisers below can read the saved draft without a
 * hydration mismatch.
 */
export function Wizard() {
  const router = useRouter();
  const { account, save } = useAccount();
  const formRef = useRef<HTMLFormElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const [initial] = useState(() => {
    // ONB-003: a link from another device wins over what this browser had.
    const fromLink = takeDraftFromLink();
    const saved = loadDraft();
    const fresh = { draft: emptyDraft(), index: 0, doneId: undefined };
    if (!saved) return fresh;
    // A finished setup whose account has since been replaced (a demo Load,
    // say) is spent. Never reopen it as a half-finished one.
    if (
      !fromLink &&
      saved.doneAccountId &&
      account?.id !== saved.doneAccountId
    ) {
      clearDraft();
      return fresh;
    }
    const doneId = saved.doneAccountId;
    // Never resume past a step that no longer validates (the card, say).
    let index = Math.min(Math.max(saved.index, 0), STEPS.length - 1);
    for (let i = 0; i < index; i++) {
      if (Object.keys(stepErrors(i, saved.draft)).length) {
        index = i;
        break;
      }
    }
    return { draft: saved.draft, index, doneId };
  });

  const [draft, setDraft] = useState<Draft>(initial.draft);
  const [index, setIndex] = useState(initial.index);
  const [doneId, setDoneId] = useState<string | undefined>(initial.doneId);
  const [showErrors, setShowErrors] = useState(false);
  const [resumed, setResumed] = useState(
    () => !initial.doneId && draftHasContent(initial.draft),
  );
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    saveDraft({ draft, index, doneAccountId: doneId });
  }, [draft, index, doneId]);

  // Steps without an autofocused field would otherwise drop focus to <body>
  // when the old step unmounts. Land on the new title instead.
  useEffect(() => {
    const active = document.activeElement;
    if (!active || active === document.body) titleRef.current?.focus();
  }, [index]);

  const set = useCallback((patch: (d: Draft) => void) => {
    setDraft((prev) => {
      const next = structuredClone(prev);
      patch(next);
      return next;
    });
  }, []);

  const step = STEPS[index];
  const errors = showErrors ? stepErrors(index, draft) : {};
  const errorCount = Object.keys(errors).length;

  function go(to: number) {
    setIndex(to);
    setShowErrors(false);
    setResumed(false);
    setConfirmReset(false);
    scrollAppTop();
  }

  function next(e: React.FormEvent) {
    e.preventDefault();
    if (Object.keys(stepErrors(index, draft)).length) {
      setShowErrors(true);
      // Keyboard and screen-reader users land on the first problem.
      requestAnimationFrame(() => {
        const first = formRef.current?.querySelector("[data-field-error]");
        const control = first?.parentElement?.querySelector<HTMLElement>(
          "input, textarea, select, button",
        );
        control?.focus();
      });
      return;
    }
    if (index === STEPS.length - 1) {
      const created = draftToAccount(draft);
      save(created);
      setDoneId(created.id);
      scrollAppTop();
      return;
    }
    go(index + 1);
  }

  function startOver() {
    setDraft(emptyDraft());
    go(0);
  }

  function leave(to: string) {
    clearDraft();
    router.push(to);
  }

  if (doneId) {
    return (
      <div className="mx-auto w-full max-w-lg px-5 pb-10">
        <OnboardingHeader />
        <StepDone
          draft={draft}
          onFeed={() => leave("/feed")}
          onProfile={() => leave("/profile")}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 pb-6">
      <OnboardingHeader
        right={
          <span
            className="text-[13px] tabular-nums text-faint"
            aria-label={`Step ${index + 1} of ${STEPS.length}`}
          >
            {index + 1} / {STEPS.length}
          </span>
        }
      />

      <div
        className="mb-7 h-1 w-full overflow-hidden rounded-full bg-line"
        aria-hidden
      >
        <div
          className="h-full rounded-full bg-sage transition-all duration-300"
          style={{ width: `${((index + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      {resumed ? (
        <p className="-mt-3 mb-5 text-[13px] text-muted">
          Picked up where you left off.
        </p>
      ) : null}

      <h1
        ref={titleRef}
        tabIndex={-1}
        className="font-serif text-[28px] leading-tight text-ink outline-none"
      >
        {step.title(draft)}
      </h1>
      <p className="mt-2 text-[15px] leading-relaxed text-muted">
        {step.subtitle(draft)}
      </p>

      <form
        ref={formRef}
        noValidate
        onSubmit={next}
        className="mt-7 flex flex-1 flex-col"
      >
        <div className="flex-1">{step.render({ draft, set, errors })}</div>

        <p role="status" aria-live="polite" className="sr-only">
          {errorCount
            ? `${errorCount} ${errorCount === 1 ? "thing needs" : "things need"} fixing before you continue.`
            : ""}
        </p>

        <div className="mt-8 flex items-center gap-3">
          {index > 0 ? (
            <Button variant="secondary" onClick={() => go(index - 1)}>
              Back
            </Button>
          ) : null}
          <div className="flex-1">
            <Button full type="submit">
              {step.cta ?? "Continue"}
            </Button>
          </div>
        </div>
      </form>

      {draftHasContent(draft) && !confirmReset ? (
        <ContinueElsewhere draft={draft} index={index} />
      ) : null}

      {draftHasContent(draft) ? (
        <div className="mt-5 flex min-h-11 items-center justify-center gap-4 text-[13px]">
          {confirmReset ? (
            <>
              <span className="text-muted">Clear everything?</span>
              <button
                type="button"
                onClick={startOver}
                className="font-medium text-clay underline underline-offset-4"
              >
                Yes, start over
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="font-medium text-muted underline underline-offset-4"
              >
                Keep going
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="text-faint underline underline-offset-4 hover:text-muted"
            >
              Start over
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
