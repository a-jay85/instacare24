"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button, Card, Pill, SectionTitle } from "@/components/ui";
import { PARENT_CHANNEL } from "@/lib/config";
import { roleLabel } from "@/lib/permissions";
import { SEEDS, type SeedKey } from "@/lib/seed";
import { useAccount } from "@/lib/store";

/** Not product. A switchboard so the prototype can be driven in a demo. */
export default function DemoPage() {
  const router = useRouter();
  const { account, ready, loadSeed, update, clear } = useAccount();

  return (
    <AppShell>
      <h1 className="font-serif text-[28px] leading-tight text-ink">
        Demo controls
      </h1>
      <p className="mt-2 text-[15px] leading-relaxed text-muted">
        This screen is scaffolding, not product. It exists so a walkthrough can
        jump straight to the interesting states.
      </p>

      <div className="mt-8">
        <SectionTitle>Start fresh</SectionTitle>
        <Card>
          <p className="text-[15px] leading-relaxed text-ink">
            Run the onboarding flow from scratch, as a new subscriber.
          </p>
          <div className="mt-4">
            <Button
              onClick={() => {
                clear();
                router.push("/onboarding");
              }}
            >
              Start onboarding
            </Button>
          </div>
        </Card>
      </div>

      <div className="mt-8">
        <SectionTitle>Load an account</SectionTitle>
        <div className="space-y-3">
          {(Object.keys(SEEDS) as SeedKey[]).map((key) => (
            <Card key={key}>
              <h3 className="text-[16px] font-semibold text-ink">
                {SEEDS[key].title}
              </h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-muted">
                {SEEDS[key].blurb}
              </p>
              <div className="mt-4">
                <Button
                  variant="secondary"
                  onClick={() => {
                    loadSeed(key);
                    router.push("/feed");
                  }}
                >
                  Load
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {ready && account && account.members.length > 1 ? (
        <div className="mt-8">
          <SectionTitle>Sign in as</SectionTitle>
          <Card>
            <p className="mb-4 text-[14px] leading-relaxed text-muted">
              Same account, different person. Watch the care instructions on the
              profile flip between editable and read-only.
            </p>
            <div className="space-y-2.5">
              {account.members.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => update((d) => ((d.currentMemberId = m.id), d))}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left ${
                    account.currentMemberId === m.id
                      ? "border-sage bg-sage-soft"
                      : "border-line bg-surface"
                  }`}
                >
                  <span className="text-[15px] font-medium text-ink">{m.name}</span>
                  <Pill tone={m.isAuthorizedAgent ? "sage" : "neutral"}>
                    {roleLabel(m)}
                  </Pill>
                </button>
              ))}
            </div>
            <div className="mt-4">
              <Link
                href="/profile"
                className="text-[14px] font-medium text-sage underline underline-offset-4"
              >
                Go look at the profile
              </Link>
            </div>
          </Card>
        </div>
      ) : null}

      <div className="mt-8">
        <SectionTitle>Assumptions baked in</SectionTitle>
        <Card>
          <ul className="space-y-3 text-[14px] leading-relaxed text-muted">
            <li>
              <span className="font-medium text-ink">Parent channel: {PARENT_CHANNEL}.</span>{" "}
              CHN-001 is still blocked. Voice is the only option that satisfies
              CHN-002&apos;s &ldquo;no new device, no app install&rdquo;. One
              constant in <code className="text-[13px]">src/lib/config.ts</code>{" "}
              changes it.
            </li>
            <li>
              <span className="font-medium text-ink">Consent gates delivery, not scheduling.</span>{" "}
              Onboarding finishes in one sitting and sets the window; the first
              check-in waits on the parent&apos;s recorded yes.
            </li>
            <li>
              <span className="font-medium text-ink">Escalation SLA is unset.</span>{" "}
              The copy says &ldquo;usually within 15 minutes&rdquo; because the
              real number depends on staffing.
            </li>
          </ul>
        </Card>
      </div>

      <div className="mt-8">
        <Button
          variant="ghost"
          onClick={() => {
            clear();
            router.push("/");
          }}
        >
          Clear all local data
        </Button>
      </div>
    </AppShell>
  );
}
