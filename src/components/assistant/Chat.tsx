"use client";

import { useEffect, useRef, useState } from "react";
import {
  askClinicalReviewer,
  escalateFromAssistant,
  requestCallback,
} from "@/lib/actions";
import { answer, greeting, suggestionsFor } from "@/lib/assistant/answers";
import { firstName } from "@/lib/assistant/format";
import { closeConversation, logHandoff, logTurn } from "@/lib/assistant/log";
import type { Reply } from "@/lib/assistant/types";
import { currentMember } from "@/lib/permissions";
import { useAccount } from "@/lib/store";
import type { Account } from "@/lib/types";
import {
  AssistantBubble,
  SuggestionChips,
  TypingBubble,
  UserBubble,
} from "./Bubble";
import { Composer } from "./Composer";

type Msg =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; reply: Reply; done: number[] };

/** ~500 ms feels like thinking without making anyone wait. */
const TYPING_MS = 500;

function storageKey(account: Account): string {
  return `instacare24:assistant:${account.id}:${account.createdAt}:${account.currentMemberId}`;
}

/** Conversation lives in sessionStorage only. The Account type is untouched. */
function load(key: string): Msg[] {
  try {
    const raw = window.sessionStorage.getItem(key);
    if (raw) return JSON.parse(raw) as Msg[];
  } catch {
    // Private mode or a corrupt blob: start a fresh conversation.
  }
  return [];
}

/** One id per conversation, kept with the messages for this tab. */
function loadConvId(key: string): string {
  try {
    const id = window.sessionStorage.getItem(`${key}:conv`);
    if (id) return id;
  } catch {
    // Fall through to a fresh id.
  }
  return `conv_${uid()}`;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

let seq = 0;
function uid(): string {
  seq += 1;
  return `${Date.now().toString(36)}-${seq}`;
}

/** Mounted only on the client, after the account has loaded. */
export function Chat({ account }: { account: Account }) {
  const { update } = useAccount();
  const key = storageKey(account);
  const [messages, setMessages] = useState<Msg[]>(() => load(key));
  const [convId, setConvId] = useState(() => loadConvId(key));
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const me = currentMember(account);
  const name = account.parent.preferredName;
  const hello = greeting(account, me ? firstName(me.name) : undefined);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(messages));
      window.sessionStorage.setItem(`${key}:conv`, convId);
    } catch {
      // Not persisting is fine; the chat still works.
    }
  }, [key, messages, convId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({
      block: "end",
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }, [messages.length, typing]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const say = (reply: Reply) =>
    setMessages((m) => [
      ...m,
      { id: uid(), role: "assistant", reply, done: [] },
    ]);

  const send = (text: string) => {
    if (typing || !text.trim()) return;
    // Spec: clarify once, then offer a human. Count the fallbacks just before.
    let misses = 0;
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === "user") continue;
      if (m.reply.intent !== "fallback") break;
      misses += 1;
    }
    // Answer from the account as it is now, then reveal after the pause.
    const reply = answer(account, text, misses);
    update((a) => logTurn(a, convId, reply.intent));
    setMessages((m) => [...m, { id: uid(), role: "user", text }]);
    setTyping(true);
    timer.current = setTimeout(() => {
      setTyping(false);
      say(reply);
    }, TYPING_MS);
  };

  const runAction = (msgId: string, index: number) => {
    const msg = messages.find((m) => m.id === msgId);
    if (!msg || msg.role !== "assistant" || msg.done.includes(index)) return;
    const action = msg.reply.actions?.[index];
    if (!action) return;
    const by = me?.name ?? "The family";
    const specialist = account.careTeam.specialistName;
    const now = new Date().toISOString();

    let confirm: Reply;
    if (action.kind === "callback") {
      update((a) =>
        logHandoff(
          requestCallback(a, by, action.note),
          convId,
          "care_specialist",
        ),
      );
      confirm = {
        intent: "talk",
        tone: "default",
        body: [
          `Done. ${specialist} will call you back, usually within 15 minutes during staffed hours. This will not close itself.`,
        ],
        sources: [{ module: "Escalations", at: now, verification: "record" }],
      };
    } else if (action.kind === "escalate") {
      update((a) =>
        logHandoff(
          action.clinical
            ? askClinicalReviewer(a, {
                title: action.title,
                detail: action.detail,
                by,
              })
            : escalateFromAssistant(a, {
                title: action.title,
                detail: action.detail,
                by,
                riskScore: action.riskScore,
              }),
          convId,
          action.clinical
            ? "clinical_reviewer"
            : msg.reply.tone === "emergency"
              ? "emergency"
              : "care_specialist",
        ),
      );
      confirm = {
        intent: "escalations",
        tone: msg.reply.tone === "emergency" ? "emergency" : "default",
        body: [action.confirm],
        sources: [{ module: "Escalations", at: now, verification: "record" }],
      };
    } else {
      return;
    }

    setMessages((all) => [
      ...all.map((m) =>
        m.id === msgId && m.role === "assistant"
          ? { ...m, done: [...m.done, index] }
          : m,
      ),
      { id: uid(), role: "assistant", reply: confirm, done: [] },
    ]);
  };

  // Close-out: the record is marked complete and the screen starts fresh.
  const endChat = () => {
    if (timer.current) clearTimeout(timer.current);
    setTyping(false);
    update((a) => closeConversation(a, convId));
    setMessages([]);
    setConvId(`conv_${uid()}`);
  };

  const last = messages[messages.length - 1];
  const followUps =
    !typing && last?.role === "assistant" ? last.reply.suggestions : undefined;

  return (
    // Tall enough that the composer rests just above the tab bar even before
    // the conversation fills the screen; -mb-4 cancels main's extra padding.
    <div className="-mb-4 flex min-h-[calc(100dvh-9.5rem)] flex-col lg:min-h-[calc(min(860px,100dvh-4rem)-10.75rem)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-medium text-faint">
          Ask about {name} · Family assistant
        </p>
        {messages.length ? (
          <button
            type="button"
            onClick={endChat}
            className="min-h-11 rounded-lg px-2 text-[13px] font-medium text-sage-dark underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/40"
          >
            End chat
          </button>
        ) : null}
      </div>

      <div
        role="log"
        aria-live="polite"
        aria-label="Conversation"
        className="mt-4 flex flex-1 flex-col gap-3"
      >
        <AssistantBubble reply={hello} done={[]} onAction={() => {}} />
        {messages.map((m) =>
          m.role === "user" ? (
            <UserBubble key={m.id} text={m.text} />
          ) : (
            <AssistantBubble
              key={m.id}
              reply={m.reply}
              done={m.done}
              onAction={(i) => runAction(m.id, i)}
            />
          ),
        )}
        {typing ? <TypingBubble /> : null}
        {followUps?.length ? (
          <SuggestionChips items={followUps} onPick={send} />
        ) : null}
        <div ref={endRef} aria-hidden className="scroll-mb-[16rem]" />
      </div>

      <Composer
        suggestions={suggestionsFor(account)}
        busy={typing}
        onSend={send}
      />
    </div>
  );
}
