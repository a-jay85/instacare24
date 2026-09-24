"use client";

import { TalkToSomeone } from "@/components/TalkToSomeone";
import { Card } from "@/components/ui";
import type { Account } from "@/lib/types";
import { UNNAMED_DOCTOR } from "@/lib/visits";

function Person({ name, role }: { name: string; role: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span
        aria-hidden
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cream text-[13px] font-semibold text-muted"
      >
        {name
          .replace(/^Dr\.\s*/, "")
          .split(" ")
          .map((p) => p[0])
          .slice(0, 2)
          .join("")}
      </span>
      <span>
        <span className="block text-[15px] font-medium text-ink">{name}</span>
        <span className="block text-[13px] text-muted">{role}</span>
      </span>
    </div>
  );
}

/** Who looks after her: the two InstaCare24 people, plus her own doctor. */
export function CareTeamCard({ account }: { account: Account }) {
  const { careTeam, parent } = account;
  const byDate = account.visits
    .filter((v) => v.provider !== UNNAMED_DOCTOR)
    .sort((a, b) => b.date.localeCompare(a.date));
  const doctor =
    byDate.find((v) => v.specialty === "Primary care") ?? byDate[0];

  return (
    <Card>
      <h3 className="mb-1 text-[16px] font-semibold text-ink">
        {parent.preferredName}&apos;s care team
      </h3>
      <div className="divide-y divide-line">
        <Person
          name={careTeam.vaName}
          role="Virtual assistant · makes her daily call"
        />
        <Person
          name={careTeam.specialistName}
          role="Care Specialist · handles anything that needs a person"
        />
        {doctor ? (
          <Person
            name={doctor.provider}
            role={`${doctor.specialty === "Primary care" ? "Primary doctor" : doctor.specialty} · from her last visit`}
          />
        ) : (
          <p className="py-2 text-[13px] leading-snug text-muted">
            Her doctor shows up here after you add a visit.
          </p>
        )}
      </div>
      <div className="mt-2 flex min-h-11 items-center justify-between gap-3 border-t border-line pt-3">
        <span className="text-[13px] leading-snug text-muted">
          Need a person now?
        </span>
        <TalkToSomeone variant="link" />
      </div>
    </Card>
  );
}
