"use client";

import { useState } from "react";
import { Button, Card, SectionTitle, Select } from "@/components/ui";
import { currentMember } from "@/lib/permissions";
import { useAccount } from "@/lib/store";
import { formatHour, timezoneLabel } from "@/lib/timezones";
import type { Account } from "@/lib/types";
import { CardHead, Row } from "./parts";

const HOURS = Array.from({ length: 24 }, (_, h) => ({
  id: String(h),
  label: formatHour(h),
}));

/** NTF-001: quiet hours are family-local, deliberately not parent-local. */
export function QuietHours({ account }: { account: Account }) {
  const { update } = useAccount();
  const [editing, setEditing] = useState(false);
  const me = currentMember(account);
  const { quietHours } = account;

  return (
    <div className="mt-8">
      <SectionTitle>Your notifications</SectionTitle>
      <Card>
        <CardHead
          title="Quiet hours"
          canEdit
          editing={editing}
          onEdit={() => setEditing(true)}
        />
        {editing ? (
          <div className="space-y-4">
            <Select
              label="Start"
              value={String(quietHours.startHour)}
              onChange={(v) =>
                update((d) => ((d.quietHours.startHour = Number(v)), d))
              }
              options={HOURS}
            />
            <Select
              label="End"
              value={String(quietHours.endHour)}
              onChange={(v) =>
                update((d) => ((d.quietHours.endHour = Number(v)), d))
              }
              options={HOURS}
            />
            <Button variant="secondary" onClick={() => setEditing(false)}>
              Done
            </Button>
          </div>
        ) : (
          <>
            <Row
              label="Held until morning"
              value={`${formatHour(quietHours.startHour)} – ${formatHour(quietHours.endHour)}`}
            />
            <Row
              label="Your timezone"
              value={timezoneLabel(me?.familyTimezone ?? "America/New_York")}
            />
            {/* NTF-002: safety alerts ignore quiet hours. */}
            <p className="mt-3 text-[13px] leading-relaxed text-muted">
              Routine updates wait for morning. Anything urgent comes through
              anyway, at any hour.
            </p>
          </>
        )}
      </Card>
    </div>
  );
}
