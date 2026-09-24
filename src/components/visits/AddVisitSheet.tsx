"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Banner, Button, LockNote, Sheet } from "@/components/ui";
import {
  checkFile,
  formatBytes,
  UPLOAD_LIMITS,
  type VisitSource,
} from "@/lib/visits";
import { SourceIcon } from "./VisitList";

type Mode = "choose" | "photo" | "pdf";

const SAMPLES: Record<"photo" | "pdf", { name: string; size: number }> = {
  photo: { name: "after-visit-summary.jpg", size: 2_400_000 },
  pdf: { name: "LeeCardiology_AVS.pdf", size: 310_000 },
};

function Option({
  source,
  title,
  description,
  onClick,
}: {
  source: VisitSource;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-3 rounded-2xl border border-line bg-surface p-4 text-left transition-colors hover:border-sage/40 focus-visible:ring-2 focus-visible:ring-sage/40 focus-visible:outline-none"
    >
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
          source === "audio"
            ? "bg-clay-soft text-clay"
            : "bg-sage-soft text-sage-dark"
        }`}
      >
        <SourceIcon source={source} className="h-5 w-5" />
      </span>
      <span>
        <span className="block text-[15px] font-medium text-ink">{title}</span>
        <span className="mt-0.5 block text-[13px] leading-snug text-muted">
          {description}
        </span>
      </span>
    </button>
  );
}

/**
 * Workflow Epic 1: pick an upload method, validate type and size, and on a
 * failure show the error with a retry that loops back to the options.
 * Nothing is actually uploaded; we only read the file's name and size.
 */
export function AddVisitSheet({
  open,
  onClose,
  onRecord,
  onFile,
}: {
  open: boolean;
  onClose: () => void;
  onRecord: () => void;
  onFile: (source: VisitSource, name: string, size: number) => void;
}) {
  const [mode, setMode] = useState<Mode>("choose");
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const close = () => {
    setMode("choose");
    setError(null);
    onClose();
  };

  const accept = (name: string, size: number, type: string) => {
    const result = checkFile(name, size, type);
    if (!result.ok) {
      setError(result.reason);
      return;
    }
    setMode("choose");
    setError(null);
    onFile(result.kind, name, size);
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset so choosing the same file again still fires a change.
    e.target.value = "";
    if (file) accept(file.name, file.size, file.type);
  };

  const title =
    mode === "choose"
      ? "Add a visit"
      : mode === "photo"
        ? "Photo of the after-visit summary"
        : "Upload a PDF";

  return (
    <Sheet open={open} onClose={close} title={title}>
      {mode === "choose" ? (
        <>
          <p className="text-[15px] leading-relaxed text-muted">
            We turn it into plain English. A Care Specialist checks every one
            before your family sees it.
          </p>
          <div className="mt-4 space-y-3">
            <Option
              source="audio"
              title="Record the visit"
              description={`Ask the doctor first. Most say yes. Up to ${UPLOAD_LIMITS.audioMinutes} minutes.`}
              onClick={() => {
                setMode("choose");
                onRecord();
              }}
            />
            <Option
              source="photo"
              title="Photo of the after-visit summary"
              description="The printout she was handed at the desk."
              onClick={() => setMode("photo")}
            />
            <Option
              source="pdf"
              title="Upload a PDF"
              description="From the patient portal or an email."
              onClick={() => setMode("pdf")}
            />
          </div>
          <div className="mt-5">
            <Button full variant="ghost" onClick={close}>
              Not now
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-[15px] leading-relaxed text-muted">
            {UPLOAD_LIMITS.types.join(", ")}, up to {UPLOAD_LIMITS.maxMb} MB.
            {mode === "photo" ? " One page per photo is fine." : null}
          </p>

          {error ? (
            <div className="mt-4" role="alert">
              <Banner tone="clay" title="We couldn't use that file.">
                {error}
              </Banner>
            </div>
          ) : null}

          <input
            ref={input}
            type="file"
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={onChange}
          />
          <div className="mt-5 space-y-3">
            <Button full onClick={() => input.current?.click()}>
              {error
                ? "Try another file"
                : mode === "photo"
                  ? "Take or choose a photo"
                  : "Choose a PDF"}
            </Button>
            <Button
              full
              variant="secondary"
              onClick={() => {
                const s = SAMPLES[mode];
                accept(
                  s.name,
                  s.size,
                  mode === "photo" ? "image/jpeg" : "application/pdf",
                );
              }}
            >
              No file handy? Use a sample ({formatBytes(SAMPLES[mode].size)})
            </Button>
            <Button
              full
              variant="ghost"
              onClick={() => {
                setMode("choose");
                setError(null);
              }}
            >
              Back to the options
            </Button>
          </div>
          <LockNote>
            Encrypted on the way up and while stored. Only her family and care
            team can open it.
          </LockNote>
        </>
      )}
    </Sheet>
  );
}
