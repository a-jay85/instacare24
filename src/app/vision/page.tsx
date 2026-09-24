"use client";

import Link from "next/link";
import { Ask } from "@/components/vision/Ask";
import { Business } from "@/components/vision/Business";
import { Hero } from "@/components/vision/Hero";
import { HumanLoop } from "@/components/vision/HumanLoop";
import { Loop } from "@/components/vision/Loop";
import { Metrics } from "@/components/vision/Metrics";
import { People } from "@/components/vision/People";
import { Platform } from "@/components/vision/Platform";
import { Principles } from "@/components/vision/Principles";
import { FOCUS } from "@/components/vision/Section";

const NAV = [
  { id: "loop", label: "Loop" },
  { id: "people", label: "People" },
  { id: "hitl", label: "Human in the loop" },
  { id: "platform", label: "Platform" },
  { id: "model", label: "Model" },
  { id: "metrics", label: "Metrics" },
  { id: "principles", label: "Principles" },
  { id: "ask", label: "The ask" },
];

/** Investor narrative. Desktop-first, own layout, no AppShell. */
export default function VisionPage() {
  return (
    <div className="min-h-dvh bg-cream">
      <nav
        aria-label="Vision sections"
        className="sticky top-0 z-20 border-b border-line bg-cream/90 backdrop-blur"
      >
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3 lg:px-10">
          <Link
            href="/"
            className={`shrink-0 rounded-md font-serif text-lg font-semibold text-ink ${FOCUS}`}
          >
            InstaCare<span className="text-sage">24</span>
          </Link>
          <ul className="hidden flex-1 items-center gap-1 overflow-x-auto text-[14px] md:flex">
            {NAV.map((n) => (
              <li key={n.id}>
                <a
                  href={`#${n.id}`}
                  className={`block rounded-lg px-2.5 py-2 whitespace-nowrap text-muted hover:text-ink ${FOCUS}`}
                >
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
          <Link
            href="/demo"
            className={`ml-auto shrink-0 rounded-lg px-3 py-2 text-[14px] font-medium text-sage-dark hover:underline ${FOCUS}`}
          >
            Demo switchboard
          </Link>
        </div>
      </nav>

      <main>
        <Hero />
        <Loop />
        <People />
        <HumanLoop />
        <Platform />
        <Business />
        <Metrics />
        <Principles />
        <Ask />
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto max-w-6xl px-6 py-8 text-[13px] text-muted lg:px-10">
          InstaCare24 investor prototype. All families, calls and AI outputs are
          scripted demo data. Targets are commitments from the v1 scope, not
          results.
        </div>
      </footer>
    </div>
  );
}
