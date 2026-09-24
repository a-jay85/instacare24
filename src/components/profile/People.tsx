"use client";

import { useState } from "react";
import { Button, Card, Pill, SectionTitle } from "@/components/ui";
import { authorizedAgent, currentMember, roleLabel } from "@/lib/permissions";
import { timezoneLabel } from "@/lib/timezones";
import type { Account, Member } from "@/lib/types";
import { InviteCard, InviteSheet } from "./Invite";
import { HeadRow, dateLabel } from "./parts";
import { activePause } from "./Subscription";

/**
 * Onboarding creates the proxy as `m_agent` when the subscriber is not the
 * proxy, before they have accepted. Their timezone is a copy of the
 * subscriber's until then, so it is not shown as theirs.
 */
const notJoinedYet = (m: Member) => m.id === "m_agent";

/** AUT-001: two identities, two permission sets, visible rather than implied. */
export function Members({ account }: { account: Account }) {
  const [inviting, setInviting] = useState(false);
  const me = currentMember(account);
  const agent = authorizedAgent(account);
  const canInvite = Boolean(me?.isAuthorizedAgent) && !account.deceasedAt;
  const invites = account.deceasedAt ? [] : account.invites;
  return (
    <div className="mt-8">
      <SectionTitle>Who is on this account</SectionTitle>
      <div className="space-y-3">
        {account.members.map((m) => (
          <Card key={m.id}>
            <HeadRow
              title={
                <>
                  {m.name}
                  {m.id === me?.id ? (
                    <span className="ml-2 text-[13px] font-normal text-faint">
                      you
                    </span>
                  ) : null}
                </>
              }
              aside={
                <Pill tone={m.isAuthorizedAgent ? "sage" : "neutral"}>
                  {roleLabel(m)}
                </Pill>
              }
            />
            <p className="-mt-2 text-[14px] text-muted">
              {m.relationshipToParent} ·{" "}
              {notJoinedYet(m)
                ? "Invited, not joined yet"
                : timezoneLabel(m.familyTimezone)}
            </p>
            {account.deceasedAt ? null : (
              <p className="mt-3 text-[13px] leading-relaxed text-muted">
                {m.isAuthorizedAgent && m.isPayer
                  ? "Holds the card and the healthcare proxy. Changes care instructions and invites family."
                  : m.isAuthorizedAgent
                    ? "Holds the healthcare proxy. Changes care instructions and invites family."
                    : m.isPayer
                      ? "Holds the card and can pause or cancel the subscription. Cannot change care instructions."
                      : "Can read the feed."}
              </p>
            )}
          </Card>
        ))}
        {invites.map((i) => (
          <InviteCard key={i.id} invite={i} canCancel={canInvite} />
        ))}
      </div>
      {account.deceasedAt ? null : canInvite ? (
        <div className="mt-3">
          <Button variant="secondary" onClick={() => setInviting(true)}>
            Invite family
          </Button>
          <InviteSheet
            open={inviting}
            onClose={() => setInviting(false)}
            account={account}
          />
        </div>
      ) : (
        <p className="mt-3 text-[13px] leading-relaxed text-muted">
          {agent ? agent.name.split(" ")[0] : "Her healthcare proxy"} can invite
          other family to read along.
        </p>
      )}
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
  const paused = consented ? activePause(account) : null;
  return (
    <div className="mt-8">
      <SectionTitle>Her care team</SectionTitle>
      <Card className="py-3">
        {account.deceasedAt ? null : (
          <Person name={careTeam.vaName} role="Daily check-in">
            {paused
              ? `Calls ${name} every day inside her window. Paused until ${dateLabel(paused)}, then the same voice picks up again.`
              : consented
                ? `Calls ${name} every day inside her window and writes up how she sounded.`
                : parent.consent.state === "withdrawn"
                  ? `Called ${name} every day until she asked us to stop.`
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
