"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AccountSwitcher } from "@/components/demo/AccountSwitcher";
import { QuickActions } from "@/components/demo/QuickActions";
import { SCRIPT } from "@/components/demo/script";
import { Button, Card, SectionTitle } from "@/components/ui";
import { SEEDS, type SeedKey } from "@/lib/seed";
import { clearDraft } from "@/lib/onboardingDraft";
import { useAccount } from "@/lib/store";

const LINK =
  "rounded text-left underline underline-offset-4 hover:text-sage focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage";

/** Not product. The presenter's switchboard and script for an investor demo. */
export default function DemoPage() {
  const router = useRouter();
  const { account, loadSeed, clear } = useAccount();

  /** Load a family only if it is not already the one in this browser. */
  function ensure(key?: SeedKey) {
    if (key && account?.id !== SEEDS[key].build().id) {
      clearDraft();
      loadSeed(key);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-8 lg:px-10 lg:py-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="font-serif text-xl font-semibold text-ink">
          InstaCare<span className="text-sage">24</span>
          <span className="ml-2 text-[13px] font-normal text-faint">
            Demo switchboard
          </span>
        </Link>
        <nav className="flex gap-4 text-[14px] font-medium text-sage-dark">
          <Link href="/feed">Family app</Link>
          <Link href="/console" target="_blank">
            Staff console ↗
          </Link>
          <Link href="/vision">Why this wins</Link>
        </nav>
      </header>

      <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-muted">
        Scaffolding, not product. Load a family, then follow the script. On a
        laptop, keep the family app and the staff console side by side: what the
        VA logs shows up in the family&apos;s feed on its own. Rosa&apos;s call
        window opens at the hour you press Load, so load her just before you
        start. Her window can&apos;t run past 7 PM her time, so after 7 PM New
        York time the demo moves her to the first time zone west where it is
        still day.
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
        <section aria-labelledby="script-h">
          <SectionTitle>
            <span id="script-h">The walkthrough · about 8 minutes</span>
          </SectionTitle>
          <ol className="space-y-3">
            {SCRIPT.map((step, i) => (
              <li key={step.title}>
                <Card className="flex gap-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sage-soft font-serif text-[15px] font-semibold text-sage-dark">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[16px] font-semibold text-ink">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-[14px] leading-relaxed text-muted">
                      {step.say}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[14px] font-medium text-sage-dark">
                      {step.newTab ? (
                        <Link
                          href={step.href}
                          target="_blank"
                          onClick={() => ensure(step.needs)}
                          className={LINK}
                        >
                          {step.cta} ↗
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (step.seed) loadSeed(step.seed);
                            else ensure(step.needs);
                            if (step.href === "/onboarding") clear();
                            router.push(step.href);
                          }}
                          className={LINK}
                        >
                          {step.cta}
                        </button>
                      )}
                      {step.also ? (
                        <Link
                          href={step.also.href}
                          target="_blank"
                          className={LINK}
                        >
                          {step.also.cta} ↗
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ol>
        </section>

        <aside className="space-y-8">
          <section>
            <SectionTitle>Families</SectionTitle>
            <div className="space-y-3">
              {(Object.keys(SEEDS) as SeedKey[]).map((key) => (
                <Card key={key}>
                  <h3 className="text-[15px] font-semibold text-ink">
                    {SEEDS[key].title}
                  </h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted">
                    {SEEDS[key].blurb}
                  </p>
                  <div className="mt-3">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        // A half-finished sign-up must never resurface mid-pitch.
                        clearDraft();
                        loadSeed(key);
                        router.push("/feed");
                      }}
                    >
                      {account?.id === SEEDS[key].build().id
                        ? "Reset and open"
                        : "Load"}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {account ? <AccountSwitcher /> : null}
          {account ? <QuickActions /> : null}

          <section>
            <SectionTitle>Start over</SectionTitle>
            <Button
              variant="ghost"
              onClick={() => {
                clear();
                router.push("/");
              }}
            >
              Clear all local data
            </Button>
          </section>
        </aside>
      </div>
    </div>
  );
}
