"use client";

import { useEffect, useRef, useState } from "react";
import {
  Banner,
  Button,
  Chip,
  Field,
  Provenance,
  RadioCard,
  Sheet,
  TextArea,
} from "@/components/ui";
import {
  REMINDER_HOURS,
  SAMPLE_LABEL_SCAN,
  newMedId,
  shortHour,
} from "@/lib/meds";
import type { Medication } from "@/lib/types";

type Kind = "scheduled" | "as_needed";

/**
 * MED-001 / MED-002. The bottle-label scan is scripted: no OCR or model runs,
 * it fills a fixed sample after 1.2 s. Per the onboarding workflow the
 * caregiver confirms the schedule before anything is saved.
 */
export function AddMedSheet({
  open,
  onClose,
  onSave,
  parentName,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (med: Medication) => void;
  parentName: string;
}) {
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [purpose, setPurpose] = useState("");
  const [kind, setKind] = useState<Kind>("scheduled");
  const [hours, setHours] = useState<number[]>([]);
  const [instructions, setInstructions] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const reset = () => {
    if (timer.current) clearTimeout(timer.current);
    setName("");
    setDose("");
    setPurpose("");
    setKind("scheduled");
    setHours([]);
    setInstructions("");
    setScanning(false);
    setScanned(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const scan = () => {
    setScanning(true);
    timer.current = setTimeout(() => {
      setName(SAMPLE_LABEL_SCAN.name);
      setDose(SAMPLE_LABEL_SCAN.dose);
      setPurpose(SAMPLE_LABEL_SCAN.purpose);
      setKind("scheduled");
      setHours(SAMPLE_LABEL_SCAN.hours);
      setInstructions(SAMPLE_LABEL_SCAN.instructions);
      setScanning(false);
      setScanned(true);
    }, 1200);
  };

  const toggleHour = (h: number) =>
    setHours((prev) =>
      prev.includes(h) ? prev.filter((x) => x !== h) : [...prev, h],
    );

  const valid =
    name.trim().length > 0 && (kind === "as_needed" || hours.length > 0);

  const save = () => {
    if (!valid) return;
    onSave({
      id: newMedId(),
      name: name.trim(),
      dose: dose.trim(),
      purpose: purpose.trim(),
      schedule:
        kind === "scheduled"
          ? { kind: "scheduled", hours: [...hours].sort((a, b) => a - b) }
          : { kind: "as_needed" },
      instructions: instructions.trim() || undefined,
    });
    close();
  };

  return (
    <Sheet open={open} onClose={close} title="Add a medication">
      {scanning ? (
        <div className="py-10 text-center" role="status">
          <span
            aria-hidden
            className="mx-auto block h-10 w-10 animate-spin rounded-full border-4 border-sage-soft border-t-sage"
          />
          <p className="mt-4 text-[15px] text-ink">Reading the label…</p>
        </div>
      ) : (
        <div className="space-y-4">
          {scanned ? (
            <Banner tone="amber" title="Check this before you save.">
              InstaCare24 AI read this from the bottle label. Labels can be
              misread, so make sure every field matches the bottle.
            </Banner>
          ) : (
            <button
              type="button"
              onClick={scan}
              className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-sage/50 bg-sage-soft/50 p-4 text-left hover:border-sage"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sage text-white">
                <svg
                  viewBox="0 0 20 20"
                  aria-hidden
                  className="h-5 w-5 fill-current"
                >
                  <path d="M7.2 3.5 6.3 5H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2.3l-.9-1.5a1 1 0 0 0-.9-.5H8.1a1 1 0 0 0-.9.5ZM10 7.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Z" />
                </svg>
              </span>
              <span>
                <span className="block text-[15px] font-medium text-ink">
                  Scan the bottle label
                </span>
                <span className="block text-[13px] text-muted">
                  AI-assisted. You check it before it is saved.
                </span>
              </span>
            </button>
          )}

          <Field
            label="Name"
            value={name}
            onChange={setName}
            placeholder="e.g. Lisinopril"
          />
          <div className="grid grid-cols-[2fr_3fr] gap-3">
            <Field
              label="Dose"
              value={dose}
              onChange={setDose}
              placeholder="e.g. 10 mg"
            />
            <Field
              label="What it's for"
              value={purpose}
              onChange={setPurpose}
              placeholder="e.g. Blood pressure"
            />
          </div>

          <div>
            <p className="mb-1.5 text-sm font-medium text-ink">
              When she takes it
            </p>
            <div className="space-y-2.5">
              <RadioCard
                selected={kind === "scheduled"}
                onSelect={() => setKind("scheduled")}
                title="At set times"
                description={`We remind ${parentName} at each time, on her clock.`}
              />
              <RadioCard
                selected={kind === "as_needed"}
                onSelect={() => setKind("as_needed")}
                title="As needed"
                description="No reminder. Never counts as missed."
              />
            </div>
          </div>

          {kind === "scheduled" ? (
            <div>
              <p className="mb-2 text-sm font-medium text-ink">
                Reminder times, her time
              </p>
              <div className="flex flex-wrap gap-2">
                {REMINDER_HOURS.map((h) => (
                  <Chip
                    key={h}
                    label={shortHour(h)}
                    selected={hours.includes(h)}
                    onToggle={() => toggleHour(h)}
                  />
                ))}
              </div>
              {hours.length === 0 ? (
                <p className="mt-2 text-[13px] text-muted">
                  Pick at least one time, or choose &ldquo;As needed&rdquo;.
                </p>
              ) : null}
            </div>
          ) : null}

          <TextArea
            label="Instructions"
            rows={2}
            value={instructions}
            onChange={setInstructions}
            placeholder="e.g. With food"
          />

          {scanned ? (
            <Provenance>Read by InstaCare24 AI · you confirm</Provenance>
          ) : null}

          <div className="flex gap-3 pt-1">
            <Button onClick={save} disabled={!valid}>
              {scanned ? "Confirm and save" : "Save"}
            </Button>
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Sheet>
  );
}
