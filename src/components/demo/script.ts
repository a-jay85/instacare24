/**
 * The presenter's walkthrough. Each step says what to click and what to say.
 * `seed` loads a family first; `href` is where the step happens.
 */
export type ScriptStep = {
  title: string;
  say: string;
  href: string;
  newTab?: boolean;
  seed?: "michael" | "karen";
};

export const SCRIPT: ScriptStep[] = [
  {
    title: "Sign-up in under 15 minutes",
    say: "Seven steps, one idea each. Paying and deciding are kept apart on step three. It ends waiting on Mom's own yes.",
    href: "/onboarding",
  },
  {
    title: "Nothing runs without her consent",
    say: "Margaret hasn't agreed yet, so the app says so. In the console, Dana makes the consent call and records her yes.",
    href: "/feed",
    seed: "karen",
  },
  {
    title: "Is Mom alright today?",
    say: "The Reyes family. Today's answer is the first thing on screen. Scroll down: an unchecked day never looks like a fine one.",
    href: "/feed",
    seed: "michael",
  },
  {
    title: "The VA makes the call",
    say: "Open the console in a second tab. Priya sees her queue in the order windows close, reads Rosa's notes, and logs the call in under a minute.",
    href: "/console",
    newTab: true,
  },
  {
    title: "Something is off",
    say: "Log 'something is off' with notes like 'dizzy, nearly fell'. The AI risk score routes it. The family tab updates on its own, and the escalation has a named owner.",
    href: "/console",
    newTab: true,
  },
  {
    title: "Ask anything, safely",
    say: "Try 'how is Mom today', 'what is the lisinopril for', then 'should she stop taking it?' to show the guardrail hand off to a human.",
    href: "/assistant",
  },
  {
    title: "The doctor visit, in plain English",
    say: "Record a visit or snap the after-visit summary. It is transcribed, summarised, and checked by a person before the family sees it.",
    href: "/care/visits",
  },
  {
    title: "The insurance letter nobody reads",
    say: "Each Explanation of Benefits in one sentence. The denied physical therapy claim goes to Dana for appeal in one tap.",
    href: "/care/insurance",
  },
  {
    title: "Why this wins",
    say: "The loop, the human-in-the-loop cost model, and the metrics we'll be held to.",
    href: "/vision",
  },
];
