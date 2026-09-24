/**
 * The presenter's walkthrough. Each step says what to click and what to say.
 * `seed` resets to a family first; `needs` loads that family only if a
 * different one (or none) is loaded, so earlier steps' changes survive.
 * `href` is where the step happens; `cta` labels the link.
 */
export type ScriptStep = {
  title: string;
  say: string;
  href: string;
  cta: string;
  newTab?: boolean;
  seed?: "michael" | "karen";
  needs?: "michael" | "karen";
  also?: { href: string; cta: string };
};

export const SCRIPT: ScriptStep[] = [
  {
    title: "Sign-up in under 15 minutes",
    say: "Seven steps, one idea each. Paying and deciding are kept apart on step three. It ends waiting on Mom's own yes.",
    href: "/onboarding",
    cta: "Start sign-up (clears the loaded family)",
  },
  {
    title: "Nothing runs without her consent",
    say: "Margaret hasn't agreed yet, so the app says so. In the console, Dana makes the consent call and records her yes.",
    href: "/feed",
    cta: "Load the Whitfields and open the feed",
    seed: "karen",
    also: { href: "/console", cta: "Consent calls in the console" },
  },
  {
    title: "Is Mom alright today?",
    say: "The Reyes family. Today's answer is the first thing on screen. Scroll down: an unchecked day never looks like a fine one.",
    href: "/feed",
    cta: "Load the Reyes family and open the feed",
    seed: "michael",
  },
  {
    title: "The VA makes the call",
    say: "Open the console in a second tab. Priya sees her queue in the order windows close, reads Rosa's notes, and logs the call in under a minute.",
    href: "/console",
    cta: "Open the console in a new tab",
    newTab: true,
    needs: "michael",
  },
  {
    title: "Something is off",
    say: "Log 'something is off' with notes like 'dizzy, nearly fell'. The AI risk score routes it. The family tab updates on its own: nobody has it yet. Take it under Escalations with a next action, and the family sees who has it.",
    href: "/console",
    cta: "Open the console in a new tab",
    newTab: true,
    needs: "michael",
  },
  {
    title: "Ask anything, safely",
    say: "Try 'How is Rosa today?', 'What is metformin for?', then 'Should she stop the lisinopril?' to show the guardrail hand off to a human. 'She fell' shows the emergency path.",
    href: "/assistant",
    cta: "Open the assistant",
    needs: "michael",
  },
  {
    title: "The doctor visit, in plain English",
    say: "Record a visit or snap the after-visit summary. It is transcribed, summarised, and checked by a person before the family sees it.",
    href: "/care/visits",
    cta: "Open visits",
    needs: "michael",
  },
  {
    title: "The insurance letter nobody reads",
    say: "Each Explanation of Benefits in one sentence. The denied physical therapy claim goes to Dana for appeal in one tap.",
    href: "/care/insurance",
    cta: "Open insurance",
    needs: "michael",
  },
  {
    title: "Why this wins",
    say: "The loop, the human-in-the-loop cost model, and the metrics we'll be held to.",
    href: "/vision",
    cta: "Open the investor narrative",
  },
];
