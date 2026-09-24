"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { draftLink, type Draft } from "@/lib/onboardingDraft";

/**
 * ONB-003 (P1): finish setup on another device. The link carries what has
 * been typed so far, never the card.
 */
export function ContinueElsewhere({
  draft,
  index,
}: {
  draft: Draft;
  index: number;
}) {
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!link)
    return (
      <div className="mt-5 flex justify-center">
        <button
          type="button"
          onClick={() => setLink(draftLink({ draft, index }))}
          className="min-h-11 text-[13px] font-medium text-sage-dark underline underline-offset-4"
        >
          Finish on another device
        </button>
      </div>
    );

  return (
    <div className="mt-5 rounded-2xl border border-line bg-surface p-4">
      <p className="text-[14px] font-medium text-ink">
        Open this link on your other device
      </p>
      <p className="mt-1 text-[13px] leading-relaxed text-muted">
        It picks up on this step with what you have typed. It holds those
        details, so send it only to yourself. Your card is never in it.
      </p>
      <label className="mt-3 block">
        <span className="sr-only">Link to finish on another device</span>
        <input
          readOnly
          value={link}
          onFocus={(e) => e.target.select()}
          className="w-full truncate rounded-xl border border-line bg-cream px-3 py-2 text-[13px] text-ink"
        />
      </label>
      <div className="mt-3 flex gap-2">
        <Button
          variant="secondary"
          onClick={() => {
            navigator.clipboard?.writeText(link).then(
              () => setCopied(true),
              () => setCopied(false),
            );
          }}
        >
          {copied ? "Copied" : "Copy link"}
        </Button>
        <Button variant="ghost" onClick={() => setLink(null)}>
          Done
        </Button>
      </div>
    </div>
  );
}
