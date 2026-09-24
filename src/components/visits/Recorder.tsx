"use client";

import { useEffect, useState } from "react";
import { Banner, Button } from "@/components/ui";
import { UPLOAD_LIMITS } from "@/lib/visits";

const BARS = 12;
const LIMIT = UPLOAD_LIMITS.audioMinutes * 60;

function clock(s: number): string {
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * SIMULATED recording. No microphone is opened (no getUserMedia); the timer and
 * the waveform are for show. Keyframes live here rather than in globals.css,
 * and only run when the viewer has not asked for reduced motion.
 */
export function Recorder({
  name,
  onStop,
  onCancel,
}: {
  name: string;
  onStop: (seconds: number) => void;
  onCancel: () => void;
}) {
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  useEffect(() => {
    if (running && seconds >= LIMIT) onStop(seconds);
  }, [running, seconds, onStop]);

  const toggle = () => {
    if (running) onStop(seconds);
    else setRunning(true);
  };

  return (
    <div>
      <style>{`
        @keyframes ic-wave { 0%, 100% { transform: scaleY(0.25); } 50% { transform: scaleY(1); } }
        @media (prefers-reduced-motion: no-preference) {
          .ic-wave-on { animation: ic-wave 0.9s ease-in-out infinite; }
        }
      `}</style>

      {/* Both banners share one grid cell, so the height never changes and
          the button never moves under a finger when recording starts. */}
      <div className="grid">
        <div
          className={`col-start-1 row-start-1 [&>div]:h-full ${running ? "invisible" : ""}`}
          aria-hidden={running}
        >
          <Banner tone="amber" title="Ask the doctor first. Most say yes.">
            Something like: &ldquo;Is it alright if I record this so I can share
            it with {name}&apos;s family?&rdquo; Put the phone face up where
            everyone can see it.
          </Banner>
        </div>
        <div
          className={`col-start-1 row-start-1 [&>div]:h-full ${running ? "" : "invisible"}`}
          aria-hidden={!running}
        >
          <Banner tone="neutral" title="Recording on this phone.">
            Nothing is sent until you stop. If the doctor changes their mind,
            discard it and nothing is kept.
          </Banner>
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center">
        <div className="relative grid h-28 w-28 place-items-center">
          {running ? (
            <span
              aria-hidden
              className="absolute inset-2 rounded-full bg-clay/30 motion-safe:animate-ping"
            />
          ) : null}
          <button
            type="button"
            onClick={toggle}
            aria-label={running ? "Stop recording" : "Start recording"}
            aria-pressed={running}
            className="relative grid h-24 w-24 place-items-center rounded-full bg-clay text-white transition-colors hover:bg-clay/90 focus-visible:ring-4 focus-visible:ring-clay/30 focus-visible:outline-none"
          >
            {running ? (
              <span aria-hidden className="h-7 w-7 rounded-md bg-white" />
            ) : (
              <svg
                viewBox="0 0 20 20"
                aria-hidden
                className="h-9 w-9 fill-current"
              >
                <path d="M10 2.5a2.5 2.5 0 0 0-2.5 2.5v5a2.5 2.5 0 0 0 5 0V5A2.5 2.5 0 0 0 10 2.5ZM5 9.5a.75.75 0 0 0-1.5 0 6.5 6.5 0 0 0 5.75 6.46V17.5a.75.75 0 0 0 1.5 0v-1.54A6.5 6.5 0 0 0 16.5 9.5a.75.75 0 0 0-1.5 0 5 5 0 0 1-10 0Z" />
              </svg>
            )}
          </button>
        </div>

        <div aria-hidden className="mt-6 flex h-10 items-center gap-1.5">
          {Array.from({ length: BARS }, (_, i) => (
            <span
              key={i}
              className={`h-full w-1.5 origin-center rounded-full ${
                running ? "ic-wave-on bg-sage" : "bg-line"
              }`}
              style={{
                // Static but uneven when motion is reduced; the animation overrides it otherwise.
                transform: `scaleY(${running ? [0.5, 0.9, 0.65, 0.35][i % 4] : 0.25})`,
                animationDelay: `${(i % 4) * 0.15 + (i % 2) * 0.1}s`,
              }}
            />
          ))}
        </div>

        <p
          className="mt-4 font-serif text-[32px] tabular-nums text-ink"
          aria-live="off"
        >
          {clock(seconds)}
        </p>
        <p className="mt-1 text-[14px] text-muted" role="status">
          {running
            ? "Recording. Tap the square to stop."
            : "Tap to start recording the visit."}
        </p>
        <p className="mt-1 text-[13px] text-faint">
          Up to {UPLOAD_LIMITS.audioMinutes} minutes. It stops by itself after
          that.
        </p>
      </div>

      <div className="mt-8">
        <Button full variant="ghost" onClick={onCancel}>
          {running ? "Discard this recording" : "Cancel"}
        </Button>
      </div>
    </div>
  );
}
