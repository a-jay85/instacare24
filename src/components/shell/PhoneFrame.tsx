"use client";

import Link from "next/link";
import type { ReactNode } from "react";

/**
 * On a phone the app is just the page. On a laptop (the usual investor
 * meeting) it sits in a device frame with presenter links beside it.
 *
 * `translateZ(0)` makes the frame the containing block for `position: fixed`,
 * so the tab bar and sheets stay inside the phone instead of the browser.
 * Pages inside use `min-h-dvh lg:min-h-full` for full-height layouts.
 */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="lg:flex lg:min-h-dvh lg:items-center lg:justify-center lg:gap-14 lg:bg-[radial-gradient(900px_circle_at_15%_0%,rgba(63,122,110,0.14),transparent_55%),radial-gradient(800px_circle_at_100%_100%,rgba(176,69,60,0.08),transparent_50%)] lg:px-8 lg:py-8">
      <aside className="hidden w-72 shrink-0 lg:block">
        <p className="font-serif text-2xl font-semibold text-ink">
          InstaCare<span className="text-sage">24</span>
        </p>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          One call out, one update back. This is the family&apos;s app, shown at
          phone size.
        </p>
        <nav className="mt-8 space-y-2 text-[14px]">
          <PresenterLink
            href="/demo"
            label="Demo switchboard"
            hint="Pick a family, reset, follow the script"
          />
          <PresenterLink
            href="/console"
            label="Staff console"
            hint="Open in a second tab, side by side"
            newTab
          />
          <PresenterLink
            href="/vision"
            label="Why this wins"
            hint="Market, model, roadmap"
          />
        </nav>
      </aside>

      <div className="relative mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-cream lg:mx-0 lg:h-[min(860px,calc(100dvh-4rem))] lg:min-h-0 lg:w-[400px] lg:max-w-none lg:shrink-0 lg:overflow-hidden lg:rounded-[46px] lg:border-[10px] lg:border-ink lg:shadow-[0_30px_80px_-20px_rgba(42,38,34,0.45)] lg:[transform:translateZ(0)]">
        <div
          id="app-scroll"
          className="flex flex-1 flex-col lg:h-full lg:overflow-y-auto lg:overscroll-contain"
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function PresenterLink({
  href,
  label,
  hint,
  newTab,
}: {
  href: string;
  label: string;
  hint: string;
  newTab?: boolean;
}) {
  return (
    <Link
      href={href}
      target={newTab ? "_blank" : undefined}
      className="block rounded-2xl border border-line bg-surface/80 px-4 py-3 transition-colors hover:border-sage/40"
    >
      <span className="block font-medium text-ink">
        {label}
        {newTab ? <span className="ml-1 text-faint">↗</span> : null}
      </span>
      <span className="block text-[13px] text-muted">{hint}</span>
    </Link>
  );
}

/** Scroll to top in both layouts: the window on phones, the frame on laptops. */
export function scrollAppTop() {
  window.scrollTo({ top: 0 });
  document.getElementById("app-scroll")?.scrollTo({ top: 0 });
}
