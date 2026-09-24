"use client";

import Link from "next/link";
import { LockNote } from "@/components/ui";
import { stamp } from "@/lib/assistant/format";
import type {
  Reply,
  ReplyAction,
  Source,
  Verification,
} from "@/lib/assistant/types";

const CHIP =
  "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 py-2 text-[14px] font-medium transition-colors";

const VERIFICATION: Record<Verification, { label: string; dot: string }> = {
  human_verified: { label: "Human-verified", dot: "bg-moss" },
  ai_generated: { label: "AI-generated", dot: "bg-faint" },
  pending_review: { label: "Pending review", dot: "bg-amber" },
  record: { label: "From the record", dot: "bg-sage" },
};

/** Spec "Validate Retrieved Data": source, timestamp, who vouches for it. */
function SourceLine({ source }: { source: Source }) {
  const v = VERIFICATION[source.verification];
  return (
    <p className="flex items-start gap-1.5 text-[12px] leading-snug text-faint">
      <span
        aria-hidden
        className={`mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full ${v.dot}`}
      />
      <span>
        {source.module}
        {source.at ? ` · ${stamp(source.at)}` : ""} · {v.label}
        {source.by ? ` by ${source.by}` : ""}
      </span>
    </p>
  );
}

export function UserBubble({ text }: { text: string }) {
  return (
    <div className="ml-auto max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-sage px-4 py-2.5 text-[15px] leading-relaxed text-white [overflow-wrap:anywhere]">
      {text}
    </div>
  );
}

export function TypingBubble() {
  return (
    <div
      className="flex w-fit items-center gap-1 rounded-2xl rounded-bl-md border border-line bg-surface px-4 py-3.5"
      aria-label="The assistant is typing"
      role="status"
    >
      {[0, 150, 300].map((d) => (
        <span
          key={d}
          aria-hidden
          style={{ animationDelay: `${d}ms` }}
          className="h-2 w-2 rounded-full bg-faint motion-safe:animate-bounce"
        />
      ))}
    </div>
  );
}

function ActionButton({
  action,
  done,
  tone,
  onRun,
}: {
  action: ReplyAction;
  done: boolean;
  tone: Reply["tone"];
  onRun: () => void;
}) {
  if (action.kind === "link") {
    return (
      <Link
        href={action.href}
        className={`${CHIP} border-line bg-surface text-sage-dark hover:border-sage/40`}
      >
        {action.label} <span aria-hidden>›</span>
      </Link>
    );
  }
  if (action.kind === "tel") {
    const urgent = action.href === "tel:911";
    return (
      <a
        href={action.href}
        className={`${CHIP} ${
          urgent
            ? "border-clay bg-clay text-white hover:bg-clay/90"
            : "border-line bg-surface text-sage-dark hover:border-sage/40"
        }`}
      >
        {action.label}
      </a>
    );
  }
  const primary =
    tone === "emergency"
      ? "border-clay/40 bg-surface text-clay hover:bg-clay-soft"
      : "border-sage bg-sage text-white hover:bg-sage-dark";
  return (
    <button
      type="button"
      onClick={onRun}
      disabled={done}
      className={`${CHIP} ${
        done ? "border-line bg-cream text-muted" : primary
      } disabled:cursor-default`}
    >
      {done ? (
        <>
          <span aria-hidden>✓</span> Sent
        </>
      ) : (
        action.label
      )}
    </button>
  );
}

const BUBBLE: Record<Reply["tone"], string> = {
  default: "border-line bg-surface",
  guardrail: "border-amber/30 bg-amber-soft",
  emergency: "border-clay/40 bg-clay-soft",
};

const TAG: Partial<Record<Reply["tone"], { text: string; cls: string }>> = {
  guardrail: { text: "Medical question", cls: "text-amber" },
  emergency: { text: "Emergency", cls: "text-clay" },
};

export function AssistantBubble({
  reply,
  done,
  onAction,
}: {
  reply: Reply;
  done: number[];
  onAction: (index: number) => void;
}) {
  const tag = TAG[reply.tone];
  return (
    <div className="min-w-0 max-w-[94%] [overflow-wrap:anywhere]">
      <div
        className={`rounded-2xl rounded-bl-md border px-4 py-3 text-[15px] leading-relaxed text-ink ${BUBBLE[reply.tone]}`}
      >
        {tag ? (
          <p
            className={`mb-1 text-[12px] font-semibold uppercase tracking-[0.08em] ${tag.cls}`}
          >
            {tag.text}
          </p>
        ) : null}
        <div className="space-y-2">
          {reply.body.map((p, i) => (
            <p
              key={i}
              className={
                i === 0 && reply.tone === "emergency"
                  ? "font-semibold text-clay"
                  : ""
              }
            >
              {p}
            </p>
          ))}
        </div>
        {reply.items?.length ? (
          <ul className="mt-2.5 space-y-1.5 text-[14px] leading-snug">
            {reply.items.map((item, i) => (
              <li key={i} className="flex gap-2">
                <span
                  aria-hidden
                  className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-muted"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : null}
        {reply.privacy ? <LockNote>{reply.privacy}</LockNote> : null}
        {reply.actions?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {reply.actions.map((a, i) => (
              <ActionButton
                key={i}
                action={a}
                tone={reply.tone}
                done={done.includes(i)}
                onRun={() => onAction(i)}
              />
            ))}
          </div>
        ) : null}
      </div>
      {reply.sources?.length ? (
        <div className="mt-1.5 space-y-0.5 px-1">
          {reply.sources.map((s, i) => (
            <SourceLine key={i} source={s} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function SuggestionChips({
  items,
  onPick,
  disabled,
  scroll,
}: {
  items: string[];
  onPick: (text: string) => void;
  disabled?: boolean;
  scroll?: boolean;
}) {
  return (
    <div
      className={`flex gap-2 ${scroll ? "-mx-5 overflow-x-auto px-5 pb-1 [scrollbar-width:none]" : "flex-wrap"}`}
    >
      {items.map((s) => (
        <button
          key={s}
          type="button"
          disabled={disabled}
          onClick={() => onPick(s)}
          className="shrink-0 rounded-full border border-line bg-surface px-3.5 py-2 text-[14px] text-muted transition-colors hover:border-sage/40 hover:text-ink disabled:opacity-50"
        >
          {s}
        </button>
      ))}
    </div>
  );
}
