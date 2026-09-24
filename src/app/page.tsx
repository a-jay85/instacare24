"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PRICE_MONTHLY } from "@/lib/config";
import { clearDraft, draftHasContent, loadDraft } from "@/lib/onboardingDraft";
import { useAccount } from "@/lib/store";
import { Button } from "@/components/ui";
import { TalkToSomeone } from "@/components/TalkToSomeone";
import { PhoneFrame } from "@/components/shell/PhoneFrame";

export default function Landing() {
  const router = useRouter();
  const { account, ready } = useAccount();
  // ONB-003: a half-finished setup in this browser. Read only once the store
  // is ready (client-side), so the server render never disagrees.
  const saved = ready ? loadDraft() : null;
  // With an account already here (a demo family), a leftover draft would read
  // as stale data, so the CTA stays "Set this up".
  const resume = Boolean(
    !account && saved && !saved.doneAccountId && draftHasContent(saved.draft),
  );

  function startSetup() {
    // A finished setup should not greet you with "You're set up" again.
    if (saved?.doneAccountId) clearDraft();
    router.push("/onboarding");
  }

  return (
    <PhoneFrame>
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-6 pb-10 lg:pb-5">
        <header className="flex items-center justify-between py-6 lg:py-4">
          <span className="font-serif text-lg font-semibold text-ink">
            InstaCare<span className="text-sage">24</span>
          </span>
          <TalkToSomeone variant="link" />
        </header>

        <div className="flex flex-1 flex-col justify-center py-8 lg:py-3">
          <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-sage">
            One call out, one update back
          </p>
          <h1 className="mt-4 font-serif text-[38px] leading-[1.1] text-ink">
            Somebody checks on your mother today.
          </h1>
          <p className="mt-4 text-[17px] leading-relaxed text-muted">
            A real person calls her inside a window you choose. You get an
            honest update within half an hour — including the days she
            doesn&apos;t pick up.
          </p>

          <ul className="mt-8 space-y-3 lg:mt-6 lg:space-y-2.5 text-[15px] text-ink">
            {[
              "She installs nothing. We call the phone she already answers.",
              "We ask her permission before the first check\u2011in.",
              "Her doctor visits and insurance letters, in plain English.",
              `$${PRICE_MONTHLY} a month. Cancel in the app, no phone call.`,
            ].map((line) => (
              <li key={line} className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sage" />
                <span className="leading-relaxed">{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <Button full onClick={startSetup}>
            {resume
              ? "Pick up where you left off"
              : "Set this up — about 15 minutes"}
          </Button>
          {ready && account ? (
            <Button
              full
              variant="secondary"
              onClick={() => router.push("/feed")}
            >
              Back to {account.parent.preferredName}&apos;s feed
            </Button>
          ) : null}
          <p className="pt-2 text-center text-[13px] text-faint">
            Prototype ·{" "}
            <Link href="/demo" className="underline underline-offset-4">
              load a demo account
            </Link>
          </p>
        </div>
      </div>
    </PhoneFrame>
  );
}
