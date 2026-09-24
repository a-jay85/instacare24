"use client";

import { PhoneFrame } from "@/components/shell/PhoneFrame";
import { Wizard } from "@/components/onboarding/Wizard";
import { useAccount } from "@/lib/store";

/**
 * The wizard waits for the client store (`ready`) so it can resume a saved
 * draft (ONB-003) without the server and browser rendering different steps.
 */
export default function OnboardingPage() {
  const { ready } = useAccount();
  return <PhoneFrame>{ready ? <Wizard /> : null}</PhoneFrame>;
}
