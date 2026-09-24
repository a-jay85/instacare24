"use client";

import { Card, Pill, SectionTitle } from "@/components/ui";
import { currentMember, roleLabel } from "@/lib/permissions";
import { timezoneLabel } from "@/lib/timezones";
import type { Account } from "@/lib/types";

/** AUT-001: two identities, two permission sets, visible rather than implied. */
export function Members({ account }: { account: Account }) {
  const me = currentMember(account);
  return (
    <div className="mt-8">
      <SectionTitle>Who is on this account</SectionTitle>
      <div className="space-y-3">
        {account.members.map((m) => (
          <Card key={m.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[16px] font-semibold text-ink">
                  {m.name}
                  {m.id === me?.id ? (
                    <span className="ml-2 text-[13px] font-normal text-faint">
                      you
                    </span>
                  ) : null}
                </p>
                <p className="mt-0.5 text-[14px] text-muted">
                  {m.relationshipToParent} · {timezoneLabel(m.familyTimezone)}
                </p>
              </div>
              <Pill tone={m.isAuthorizedAgent ? "sage" : "neutral"}>
                {roleLabel(m)}
              </Pill>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-muted">
              {m.isAuthorizedAgent
                ? "Can change care instructions and end the service."
                : m.isPayer
                  ? "Holds the card and can cancel the subscription. Cannot change care instructions."
                  : "Can read the feed."}
            </p>
          </Card>
        ))}
      </div>
      {account.members.length === 1 ? (
        <p className="mt-3 text-[13px] leading-relaxed text-faint">
          Inviting a sibling is coming later. For now exactly one person holds
          the write access.
        </p>
      ) : null}
    </div>
  );
}

function Person({
  name,
  role,
  children,
}: {
  name: string;
  role: string;
  children: React.ReactNode;
}) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);
  return (
    <div className="flex items-start gap-3 py-2">
      <span
        aria-hidden
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sage-soft text-[14px] font-semibold text-sage-dark"
      >
        {initials}
      </span>
      <div>
        <p className="text-[16px] font-semibold text-ink">{name}</p>
        <p className="text-[13px] text-faint">{role}</p>
        <p className="mt-1 text-[14px] leading-relaxed text-muted">
          {children}
        </p>
      </div>
    </div>
  );
}

/** The two people behind the service, by name. */
export function CareTeam({ account }: { account: Account }) {
  const { careTeam, parent } = account;
  const name = parent.preferredName;
  const consented = parent.consent.state === "granted";
  return (
    <div className="mt-8">
      <SectionTitle>Her care team</SectionTitle>
      <Card className="py-3">
        {account.deceasedAt ? null : (
          <Person name={careTeam.vaName} role="Daily check-in">
            {consented
              ? `Calls ${name} every day inside her window and writes up how she sounded.`
              : `Will call ${name} every day, once she has agreed to it.`}
          </Person>
        )}
        <Person name={careTeam.specialistName} role="Care Specialist, US-based">
          Picks up anything that needs a person: something that seems off, a
          missed call, a hard conversation, the first weeks home from hospital.
        </Person>
      </Card>
    </div>
  );
}
