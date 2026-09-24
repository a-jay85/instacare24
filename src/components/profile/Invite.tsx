"use client";

import { useState } from "react";
import { Button, Card, Field, Pill, Sheet } from "@/components/ui";
import { useAccount } from "@/lib/store";
import type { Account, Invite } from "@/lib/types";
import { FOCUS_RING, HeadRow, dateLabel, useReturnFocus } from "./parts";

/**
 * ONB-004 / AUT-004: the authorized agent invites family to read along.
 * Invitees are not members until they accept (`acceptInvite`), so they cannot
 * show up in permissions or the assistant. Prototype: nothing is emailed; the
 * demo panel accepts on their behalf.
 */

const EMPTY = { name: "", email: "", relationship: "" };

export function InviteSheet({
  open,
  onClose,
  account,
}: {
  open: boolean;
  onClose: () => void;
  account: Account;
}) {
  const { update } = useAccount();
  const [form, setForm] = useState(EMPTY);
  useReturnFocus(open);
  const name = account.parent.preferredName;
  const valid =
    form.name.trim().length > 1 && /^\S+@\S+\.\S+$/.test(form.email.trim());

  const close = () => {
    setForm(EMPTY);
    onClose();
  };
  const send = () => {
    update((d) => {
      const invite: Invite = {
        id: `inv_${Math.random().toString(36).slice(2, 9)}`,
        name: form.name.trim(),
        email: form.email.trim(),
        relationship: form.relationship.trim(),
        sentAt: new Date().toISOString(),
      };
      d.invites = [...d.invites, invite];
      return d;
    });
    close();
  };

  return (
    <Sheet open={open} onClose={close} title="Invite family">
      <p className="text-[15px] leading-relaxed text-muted">
        They can read {name}&apos;s daily update, anything that needs a person,
        and her visit summaries. They cannot change anything. You stay the only
        one who can.
      </p>
      <div className="mt-5 space-y-4">
        <Field
          label="Their name"
          value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
        />
        <Field
          label="Email"
          type="email"
          inputMode="email"
          value={form.email}
          onChange={(v) => setForm({ ...form, email: v })}
        />
        <Field
          label={`Relationship to ${name}`}
          placeholder="Son, granddaughter, neighbor"
          value={form.relationship}
          onChange={(v) => setForm({ ...form, relationship: v })}
        />
      </div>
      <div className="mt-6 space-y-3">
        <Button full onClick={send} disabled={!valid}>
          Send invitation
        </Button>
        <Button full variant="secondary" onClick={close}>
          Not now
        </Button>
      </div>
    </Sheet>
  );
}

export function InviteCard({
  invite,
  canCancel,
}: {
  invite: Invite;
  canCancel: boolean;
}) {
  const { update } = useAccount();
  return (
    <Card>
      <HeadRow title={invite.name} aside={<Pill tone="amber">Invited</Pill>} />
      <p className="-mt-2 text-[14px] text-muted">
        {invite.relationship ? `${invite.relationship} · ` : ""}
        {invite.email}
      </p>
      <p className="mt-3 text-[13px] leading-relaxed text-muted">
        Invited on {dateLabel(invite.sentAt)}. Can read the feed once they
        accept. Nothing changes until then.
      </p>
      {canCancel ? (
        <button
          type="button"
          onClick={() =>
            update((d) => {
              d.invites = d.invites.filter((i) => i.id !== invite.id);
              return d;
            })
          }
          className={`-mb-2 -ml-3 mt-1 min-h-11 rounded-lg px-3 text-[14px] font-medium text-muted underline underline-offset-4 hover:text-ink ${FOCUS_RING}`}
        >
          Cancel invitation
        </button>
      ) : null}
    </Card>
  );
}
