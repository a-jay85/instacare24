"use client";

import { useState } from "react";
import { SuggestionChips } from "./Bubble";

/**
 * Sticky input above the tab bar. No mic on purpose: the browser's speech
 * recognition streams audio to a cloud service, which would make the
 * "no data leaves this device" promise untrue.
 */
export function Composer({
  suggestions,
  busy,
  onSend,
}: {
  suggestions: string[];
  busy: boolean;
  onSend: (text: string) => void;
}) {
  const [text, setText] = useState("");
  const canSend = text.trim().length > 0 && !busy;

  return (
    <div className="sticky bottom-[calc(6rem+env(safe-area-inset-bottom))] z-10 -mx-5 mt-4 border-t border-line/70 bg-cream/95 px-5 pb-2 pt-3 backdrop-blur">
      <SuggestionChips
        items={suggestions}
        onPick={onSend}
        disabled={busy}
        scroll
      />
      <form
        className="mt-2 flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!canSend) return;
          onSend(text.trim());
          setText("");
        }}
      >
        <label className="sr-only" htmlFor="assistant-input">
          Ask a question
        </label>
        <input
          id="assistant-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ask about her day, meds, visits…"
          autoComplete="off"
          enterKeyHint="send"
          className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-4 py-3 text-[16px] text-ink outline-none placeholder:text-faint focus:border-sage focus:ring-2 focus:ring-sage/20"
        />
        <button
          type="submit"
          disabled={!canSend}
          aria-label="Send"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-sage text-white transition-colors hover:bg-sage-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg viewBox="0 0 20 20" aria-hidden className="h-5 w-5 fill-current">
            <path d="M3.4 16.6 17.5 10 3.4 3.4l.1 5.1 8.5 1.5-8.5 1.5-.1 5.1Z" />
          </svg>
        </button>
      </form>
      {/* Family AI doc, "Apply AI Guardrails": always on screen. */}
      <p className="mt-2 text-center text-[11px] leading-snug text-muted">
        Informational coordination only. No diagnosis, prescription, treatment
        or lab interpretation.
      </p>
      <p className="mt-0.5 text-center text-[11px] text-faint">
        Scripted demo assistant · no data leaves this device
      </p>
    </div>
  );
}
