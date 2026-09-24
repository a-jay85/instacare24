"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AccountSwitcher } from "@/components/demo/AccountSwitcher";
import { QuickActions } from "@/components/demo/QuickActions";
import { SCRIPT } from "@/components/demo/script";
import { Button, Card, SectionTitle } from "@/components/ui";
import { SEEDS, type SeedKey } from "@/lib/seed";
import { useAccount } from "@/lib/store";

/** Not product. The presenter's switchboard and script for an investor demo. */
export default function DemoPage() {
  const router = useRouter();
  const { account, loadSeed, clear } = useAccount();

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
        VA logs shows up in the family&apos;s feed on its own.
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
                    <div className="mt-3 text-[14px] font-medium text-sage-dark">
                      {step.newTab ? (
                        <Link
                          href={step.href}
                          target="_blank"
                          className="underline underline-offset-4 hover:text-sage"
                        >
                          Open in a new tab ↗
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (step.seed) loadSeed(step.seed);
                            if (step.href === "/onboarding") clear();
                            router.push(step.href);
                          }}
                          className="underline underline-offset-4 hover:text-sage"
                        >
                          {step.seed
                            ? `Load ${SEEDS[step.seed].title.split(" —")[0]} and go`
                            : "Go"}
                        </button>
                      )}
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
