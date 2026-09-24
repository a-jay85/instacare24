"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ROLES, type ConsoleRole, type ConsoleView } from "@/lib/console/roles";

const RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream";

const NAV: { id: ConsoleView; label: string }[] = [
  { id: "queue", label: "Call queue" },
  { id: "escalations", label: "Escalations" },
  { id: "visits", label: "Visit summaries" },
  { id: "consent", label: "Consent calls" },
  { id: "metrics", label: "Today's metrics" },
];

/** Staff-only desktop shell. Deliberately not AppShell: no phone frame. */
export function ConsoleShell({
  role,
  onRole,
  view,
  onView,
  badges,
  children,
}: {
  role: ConsoleRole;
  onRole: (r: ConsoleRole) => void;
  view: ConsoleView;
  onView: (v: ConsoleView) => void;
  badges: Partial<Record<ConsoleView, { count: number; alarm?: boolean }>>;
  children: ReactNode;
}) {
  // Epic 8 review belongs to the Care Specialist; the RN sees escalations only.
  const nav =
    role === "clinical"
      ? NAV.filter((n) => n.id === "escalations")
      : role === "specialist"
        ? NAV
        : NAV.filter((n) => n.id !== "visits");
  return (
    <div className="flex min-h-screen flex-col bg-cream lg:flex-row">
      <aside className="flex shrink-0 flex-col gap-6 bg-ink px-5 py-6 text-cream lg:sticky lg:top-0 lg:h-screen lg:w-64">
        <div>
          <p className="font-serif text-lg font-semibold">
            InstaCare<span className="text-sage-soft">24</span>
            <span className="font-sans text-[14px] font-normal text-cream/60">
              {" "}
              · Console
            </span>
          </p>
          <p className="mt-1 text-[12px] text-cream/50">
            Internal. Staff only.
          </p>
        </div>

        <fieldset>
          <legend className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-cream/50">
            Signed in as
          </legend>
          <div className="flex flex-wrap gap-1.5 lg:flex-col">
            {ROLES.map((r) => (
              <button
                key={r.id}
                type="button"
                aria-pressed={role === r.id}
                onClick={() => onRole(r.id)}
                className={`rounded-xl px-3 py-2 text-left text-[13px] transition-colors ${RING} ${
                  role === r.id
                    ? "bg-cream/10 text-cream ring-1 ring-sage"
                    : "text-cream/60 hover:bg-cream/5 hover:text-cream"
                }`}
              >
                <span className="block font-medium">{r.name}</span>
                <span className="block text-[11px] opacity-70">{r.title}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <nav aria-label="Console">
          <ul className="flex flex-wrap gap-1 lg:flex-col">
            {nav.map((n) => {
              const active = view === n.id;
              const b = badges[n.id];
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    aria-current={active ? "page" : undefined}
                    onClick={() => onView(n.id)}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl border-l-4 px-3 py-2.5 text-left text-[14px] transition-colors ${RING} ${
                      active
                        ? "border-sage bg-cream/10 font-medium text-cream"
                        : "border-transparent text-cream/70 hover:bg-cream/5 hover:text-cream"
                    }`}
                  >
                    {n.label}
                    {b && b.count > 0 ? (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          b.alarm ? "bg-clay text-white" : "bg-cream/15"
                        }`}
                      >
                        {b.count}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-auto flex flex-wrap gap-x-4 gap-y-2 text-[13px] lg:flex-col">
          <Link
            href="/feed"
            className={`rounded text-cream/70 underline-offset-4 hover:text-cream hover:underline ${RING}`}
          >
            Open the family app ›
          </Link>
          <Link
            href="/demo"
            className={`rounded text-cream/50 hover:text-cream ${RING}`}
          >
            Demo controls
          </Link>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-5 py-8 lg:px-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
