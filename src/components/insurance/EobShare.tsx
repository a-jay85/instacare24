"use client";

import { useState } from "react";
import { Button, LockNote, money } from "@/components/ui";
import { EOB_STATUS, logEobAccess } from "@/lib/insurance";
import { useAccount } from "@/lib/store";
import type { Eob } from "@/lib/types";

const LINK_DAYS = 7;

/** Plain-text copy of the letter. Built in the browser; nothing is fetched. */
function letterText(eob: Eob, parentName: string): string {
  return [
    "Explanation of Benefits (not a bill)",
    `Patient: ${parentName}`,
    `Date of service: ${eob.date}`,
    `Provider: ${eob.provider}`,
    `Service: ${eob.service}`,
    `Status: ${EOB_STATUS[eob.status].label}`,
    `Billed: ${money(eob.billed)}`,
    ...(eob.allowed !== undefined
      ? [`Plan allows: ${money(eob.allowed)}`]
      : []),
    `Plan paid: ${money(eob.planPaid)}`,
    `Patient owes: ${money(eob.youOwe)}`,
    "",
    eob.plain,
    ...eob.flags.map((f) => `- ${f}`),
  ].join("\n");
}

/**
 * "View / Download EOB". The file is made on this device and the download is
 * written to the letter's audit log.
 */
function download(eob: Eob, parentName: string) {
  const blob = new Blob([letterText(eob, parentName)], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `eob-${eob.date}-${eob.id}.txt`;
  // Safari drops the download if the link is detached or revoked at once.
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * The EOB workflow's last branch: "Share Document?" -> "Generate Secure Link"
 * -> "Audit Log" (logEobAccess). SCRIPTED: the link is a made-up token, nothing is uploaded or
 * sent, and the clipboard write is best-effort.
 */
export function EobShare({
  eob,
  parentName,
}: {
  eob: Eob;
  parentName: string;
}) {
  const eobId = eob.id;
  const { update } = useAccount();
  const [link, setLink] = useState<{ url: string; until: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const create = () => {
    const token = Math.random().toString(36).slice(2, 10);
    setLink({
      url: `share.instacare24.com/l/${token}`,
      until: new Date(Date.now() + LINK_DAYS * 864e5).toLocaleDateString(
        undefined,
        { month: "short", day: "numeric" },
      ),
    });
    setCopied(false);
    update((a) => logEobAccess(a, eobId, "share"));
  };

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(`https://${link.url}`);
    } catch {
      // Clipboard can be blocked; the link is on screen to copy by hand.
    }
    setCopied(true);
  };

  if (!link) {
    return (
      <div className="mt-5 space-y-2 border-t border-line pt-4">
        <Button
          full
          variant="secondary"
          onClick={() => {
            download(eob, parentName);
            update((a) => logEobAccess(a, eobId, "download"));
          }}
        >
          Download this letter
        </Button>
        <Button full variant="secondary" onClick={create}>
          Share this letter securely
        </Button>
        <p className="mt-2 text-center text-[13px] text-muted">
          For a sibling, the doctor&apos;s office or her accountant.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-5 border-t border-line pt-4" role="status">
      <p className="text-[15px] font-medium text-ink">Secure link ready</p>
      <div className="mt-2 flex items-center gap-2 rounded-xl border border-line bg-cream py-1 pr-1 pl-3">
        <span className="min-w-0 flex-1 truncate text-[14px] text-ink">
          {link.url}
        </span>
        <button
          type="button"
          onClick={copy}
          className="min-h-11 shrink-0 rounded-lg px-3 text-[14px] font-medium text-sage-dark hover:bg-surface focus-visible:ring-2 focus-visible:ring-sage/40 focus-visible:outline-none"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <LockNote>
        Works until {link.until}, then stops. Whoever opens it signs in with a
        code we text them.
      </LockNote>
    </div>
  );
}
