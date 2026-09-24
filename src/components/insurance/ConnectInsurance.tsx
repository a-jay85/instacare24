"use client";

import { useEffect, useRef, useState } from "react";
import {
  Banner,
  Button,
  Card,
  Provenance,
  RadioCard,
  Sheet,
} from "@/components/ui";
import { CARRIERS, SAMPLE_CARD_SCAN, fakePortalPolicy } from "@/lib/insurance";
import type { Insurance } from "@/lib/types";

type Flow = null | "portal" | "card";
type Stage = "pick" | "working" | "confirm";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="text-[14px] text-muted">{label}</span>
      <span className="text-right text-[15px] font-medium text-ink">
        {value}
      </span>
    </div>
  );
}

/**
 * Two intake paths from the EOB workflow: portal pull (OAuth/FHIR) or a photo
 * of the card (OCR). Both are scripted here; no network, no OCR. Either way the
 * caregiver sees what we found and confirms before it is saved.
 */
export function ConnectInsurance({
  parentName,
  onSave,
}: {
  parentName: string;
  onSave: (ins: Insurance) => void;
}) {
  const [flow, setFlow] = useState<Flow>(null);
  const [stage, setStage] = useState<Stage>("pick");
  const [carrier, setCarrier] = useState(CARRIERS[0].id);
  const [found, setFound] = useState<Insurance | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const close = () => {
    if (timer.current) clearTimeout(timer.current);
    setFlow(null);
    setStage("pick");
    setFound(null);
  };

  const run = (result: Insurance, ms: number) => {
    setStage("working");
    timer.current = setTimeout(() => {
      setFound(result);
      setStage("confirm");
    }, ms);
  };

  const start = (f: Exclude<Flow, null>) => {
    setFlow(f);
    if (f === "card") run(SAMPLE_CARD_SCAN, 1200);
  };

  return (
    <>
      <Card>
        <h3 className="text-[16px] font-semibold text-ink">
          Add {parentName}&apos;s insurance
        </h3>
        <p className="mt-1 text-[14px] leading-relaxed text-muted">
          Once it&apos;s connected, we read every letter the insurer sends about
          her care and tell you what it means.
        </p>
        <div className="mt-4 space-y-2.5">
          <RadioCard
            selected={false}
            onSelect={() => start("portal")}
            title="Connect the plan portal"
            description="Sign in to her insurer once. Letters arrive here on their own."
          />
          <RadioCard
            selected={false}
            onSelect={() => start("card")}
            title="Photo of the insurance card"
            description="Front of the card is enough. AI-assisted, you check it."
          />
        </div>
      </Card>

      <Sheet
        open={flow !== null}
        onClose={close}
        title={
          flow === "portal" ? "Connect the plan portal" : "Insurance card photo"
        }
      >
        {stage === "working" ? (
          <div className="py-10 text-center" role="status">
            <span
              aria-hidden
              className="mx-auto block h-10 w-10 animate-spin rounded-full border-4 border-sage-soft border-t-sage"
            />
            <p className="mt-4 text-[15px] text-ink">
              {flow === "portal" ? "Connecting securely…" : "Reading the card…"}
            </p>
          </div>
        ) : stage === "confirm" && found ? (
          <div className="space-y-4">
            {flow === "portal" ? (
              <Banner tone="moss" title="Connected.">
                We can now see {parentName}&apos;s claims and letters. You can
                disconnect at any time.
              </Banner>
            ) : (
              <Banner tone="amber" title="Check this against the card.">
                InstaCare24 AI read these from the photo. Cards can be misread.
              </Banner>
            )}
            <div>
              <Row label="Insurer" value={found.carrier} />
              <Row label="Plan" value={found.plan} />
              <Row label="Member ID" value={found.memberId} />
              {found.groupNumber ? (
                <Row label="Group number" value={found.groupNumber} />
              ) : null}
            </div>
            {flow === "card" ? (
              <Provenance>Read by InstaCare24 AI · you confirm</Provenance>
            ) : null}
            <div className="flex gap-3 pt-1">
              <Button
                onClick={() => {
                  onSave(found);
                  close();
                }}
              >
                {flow === "portal" ? "Done" : "Looks right, save"}
              </Button>
              <Button variant="secondary" onClick={close}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-[14px] leading-relaxed text-muted">
              Pick her insurer. You sign in on their page; we never see the
              password.
            </p>
            {CARRIERS.map((c) => (
              <RadioCard
                key={c.id}
                selected={carrier === c.id}
                onSelect={() => setCarrier(c.id)}
                title={c.name}
              />
            ))}
            <div className="flex gap-3 pt-2">
              <Button onClick={() => run(fakePortalPolicy(carrier), 1500)}>
                Continue
              </Button>
              <Button variant="secondary" onClick={close}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Sheet>
    </>
  );
}
