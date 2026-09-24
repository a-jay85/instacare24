"use client";

import Link from "next/link";
import { PhoneFrame } from "@/components/shell/PhoneFrame";
import { useAccount } from "@/lib/store";

const primary =
  "inline-flex w-full items-center justify-center rounded-xl bg-sage px-5 py-3.5 text-[15px] font-medium text-white transition-colors hover:bg-sage-dark";
const secondary =
  "inline-flex w-full items-center justify-center rounded-xl border border-line bg-surface px-5 py-3.5 text-[15px] font-medium text-ink transition-colors hover:bg-cream";

/** Root 404. Static export writes this out as 404.html. */
export default function NotFound() {
  const { account, ready } = useAccount();
  const name = account?.parent.preferredName;

  return (
    <PhoneFrame>
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-6 pb-10">
        <header className="py-6">
          <Link href="/" className="font-serif text-lg font-semibold text-ink">
            InstaCare<span className="text-sage">24</span>
          </Link>
        </header>

        <div className="flex flex-1 flex-col justify-center py-8">
          <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-faint">
            Page not found
          </p>
          <h1 className="mt-4 font-serif text-[32px] leading-tight text-ink">
            There&apos;s nothing at this address.
          </h1>
          <p className="mt-4 text-[16px] leading-relaxed text-muted">
            The link may be old, or it was typed slightly wrong.
            {name ? ` Nothing in ${name}'s account has changed.` : ""}
          </p>
        </div>

        <div className="space-y-3">
          {ready && account ? (
            <Link href="/feed" className={primary}>
              Back to {name}&apos;s feed
            </Link>
          ) : null}
          <Link href="/" className={ready && account ? secondary : primary}>
            Go to the start
          </Link>
        </div>
      </div>
    </PhoneFrame>
  );
}
