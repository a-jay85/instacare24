"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PRICE_MONTHLY } from "@/lib/config";
import { useAccount } from "@/lib/store";
import { Button } from "@/components/ui";
import { TalkToSomeone } from "@/components/TalkToSomeone";

export default function Landing() {
  const router = useRouter();
  const { account, ready } = useAccount();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-6 pb-10">
      <header className="flex items-center justify-between py-6">
        <span className="font-serif text-lg font-semibold text-ink">
          InstaCare<span className="text-sage">24</span>
        </span>
        <TalkToSomeone variant="link" />
      </header>

      <div className="flex flex-1 flex-col justify-center py-8">
        <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-sage">
          One call out, one update back
        </p>
        <h1 className="mt-4 font-serif text-[38px] leading-[1.1] text-ink">
          Somebody checks on your mother today.
        </h1>
        <p className="mt-4 text-[17px] leading-relaxed text-muted">
          A real person calls her inside a window you choose. You get an honest
          update within half an hour — including the days she doesn&apos;t pick
          up.
        </p>

        <ul className="mt-8 space-y-3 text-[15px] text-ink">
          {[
            "She installs nothing. We call the phone she already answers.",
            "We ask her permission before the first check-in.",
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
        <Button full onClick={() => router.push("/onboarding")}>
          Set this up — about 15 minutes
        </Button>
        {ready && account ? (
          <Button full variant="secondary" onClick={() => router.push("/feed")}>
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
  );
}
