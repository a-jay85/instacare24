"use client";

import { useState } from "react";
import { Card, SectionTitle } from "@/components/ui";
import { canDeliver, grantConsent, logCheckIn } from "@/lib/actions";
import { useAccount } from "@/lib/store";

/**
 * Shortcuts for when there is no time to drive the console. They call the
 * same actions the console does, so the result is identical.
 */
export function QuickActions() {
  const { account, update } = useAccount();
  const [done, setDone] = useState<string | null>(null);
  if (!account) return null;

  const name = account.parent.preferredName;
  const va = account.careTeam.vaName;

  const actions: { label: string; run: () => void; show: boolean }[] = [
    {
      label: `${name} said yes on the consent call`,
      show: account.parent.consent.state !== "granted",
      run: () => update((a) => grantConsent(a)),
    },
    {
      label: `Log today: reached, all well`,
      show: canDeliver(account),
      run: () =>
        update((a) =>
          logCheckIn(a, {
            state: "reached",
            vaName: va,
            riskScore: 6,
            summary: `${name} answered straight away and sounded bright. She'd been to the market and was about to call her sister. Took her morning pills.`,
          }),
        ),
    },
    {
      label: `Log today: something is off`,
      show: canDeliver(account),
      run: () =>
        update((a) =>
          logCheckIn(a, {
            state: "something_off",
            vaName: va,
            riskScore: 68,
            summary: `${name} said she felt dizzy getting out of bed and nearly fell. She is sitting down now and sounds clear. Dana is calling her back and will talk to Dr. Alvarez's office.`,
          }),
        ),
    },
    {
      label: `Log today: no answer after retries`,
      show: canDeliver(account),
      run: () =>
        update((a) =>
          logCheckIn(a, {
            state: "not_reached",
            vaName: va,
            summary: `No answer at the start of her window or on the two retries 20 minutes apart. Dana is on it and will try her emergency contact.`,
          }),
        ),
    },
  ];

  return (
    <section>
      <SectionTitle>Fast-forward</SectionTitle>
      <Card>
        <p className="mb-3 text-[13px] leading-relaxed text-muted">
          Same result as doing it in the console, in one click.
        </p>
        <div className="space-y-2">
          {actions
            .filter((a) => a.show)
            .map((a) => (
              <button
                key={a.label}
                type="button"
                onClick={() => {
                  a.run();
                  setDone(a.label);
                }}
                className="w-full rounded-xl border border-dashed border-line px-4 py-2.5 text-left text-[14px] text-ink hover:border-sage/50 hover:bg-sage-soft/40"
              >
                {a.label}
              </button>
            ))}
        </div>
        {done ? (
          <p role="status" className="mt-3 text-[13px] text-moss">
            Done: {done}. Open the family app to see it.
          </p>
        ) : null}
      </Card>
    </section>
  );
}
