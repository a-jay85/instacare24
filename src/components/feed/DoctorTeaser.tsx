"use client";

import Link from "next/link";
import { Provenance, SectionTitle } from "@/components/ui";
import type { Account } from "@/lib/types";

/** The newest visit summary a person has checked. Full detail lives in Care. */
export function DoctorTeaser({ account }: { account: Account }) {
  const visit = account.visits
    .filter((v) => v.status === "ready")
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  if (!visit) return null;

  const date = new Date(visit.date + "T12:00:00Z").toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="mt-8">
      <SectionTitle>Latest from the doctor</SectionTitle>
      <Link
        href="/care/visits"
        className="block rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-sage/40"
      >
        <p className="text-[13px] font-medium text-muted">
          {visit.provider} · {visit.specialty} · {date}
        </p>
        <p className="mt-2 line-clamp-2 text-[15px] leading-relaxed text-ink">
          {visit.plain}
        </p>
        {visit.verifiedBy ? (
          <Provenance>Checked by {visit.verifiedBy}</Provenance>
        ) : null}
        <p className="mt-3 text-[14px] font-medium text-sage-dark">
          Read the full visit <span aria-hidden>›</span>
        </p>
      </Link>
    </div>
  );
}
