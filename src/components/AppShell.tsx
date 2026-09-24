"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PhoneFrame } from "./shell/PhoneFrame";
import { TalkToSomeone } from "./TalkToSomeone";

type TabDef = { href: string; label: string; icon: React.ReactNode };

const ICON = "h-5 w-5 fill-current";

const LEFT_TABS: TabDef[] = [
  {
    href: "/feed",
    label: "Today",
    icon: (
      <svg viewBox="0 0 20 20" aria-hidden className={ICON}>
        <path d="M10 2.2 2.5 8v9.3c0 .3.2.5.5.5h4.5v-5.2h5v5.2H17c.3 0 .5-.2.5-.5V8L10 2.2Z" />
      </svg>
    ),
  },
  {
    href: "/care",
    label: "Care",
    icon: (
      <svg viewBox="0 0 20 20" aria-hidden className={ICON}>
        <path d="M10 17.5s-6.8-4.1-6.8-9A3.8 3.8 0 0 1 10 6a3.8 3.8 0 0 1 6.8 2.5c0 4.9-6.8 9-6.8 9Z" />
      </svg>
    ),
  },
];

const RIGHT_TABS: TabDef[] = [
  {
    href: "/assistant",
    label: "Ask",
    icon: (
      <svg viewBox="0 0 20 20" aria-hidden className={ICON}>
        <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3h9A2.5 2.5 0 0 1 17 5.5v6a2.5 2.5 0 0 1-2.5 2.5H9l-3.6 2.9c-.3.3-.8 0-.8-.4V14h.1A2.5 2.5 0 0 1 3 11.5v-6Zm4 3.2a1 1 0 1 0 0 .1Zm3 0a1 1 0 1 0 0 .1Zm3 0a1 1 0 1 0 0 .1Z" />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: (
      <svg viewBox="0 0 20 20" aria-hidden className={ICON}>
        <path d="M10 10.2a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2ZM3.4 17.4c0-3 3-5.2 6.6-5.2s6.6 2.2 6.6 5.2v.1H3.4v-.1Z" />
      </svg>
    ),
  },
];

function Tab({ tab, pathname }: { tab: TabDef; pathname: string }) {
  // Trailing slashes come from the static export, and a GitHub Pages basePath
  // may or may not be stripped. Match on the path segment so both are fine.
  const active =
    pathname.endsWith(tab.href) || pathname.includes(`${tab.href}/`);
  return (
    <Link
      href={tab.href}
      aria-current={active ? "page" : undefined}
      className={`flex min-w-14 flex-col items-center gap-1 px-2 py-2 text-[11px] font-medium transition-colors ${
        active ? "text-sage-dark" : "text-faint hover:text-muted"
      }`}
    >
      <span className="grid h-9 w-9 place-items-center">{tab.icon}</span>
      {tab.label}
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname().replace(/\/$/, "");

  return (
    <PhoneFrame>
      <header className="flex items-center justify-between px-5 pb-2 pt-5">
        <Link
          href="/feed"
          className="font-serif text-lg font-semibold text-ink"
        >
          InstaCare<span className="text-sage">24</span>
        </Link>
        <Link href="/demo" className="text-[13px] text-faint hover:text-muted">
          Demo
        </Link>
      </header>

      <main className="flex-1 px-5 pb-28">{children}</main>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface"
      >
        <div className="mx-auto flex w-full max-w-lg items-end justify-around px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
          {LEFT_TABS.map((t) => (
            <Tab key={t.href} tab={t} pathname={pathname} />
          ))}
          {/* ESC-001: one always-visible route to a human, dead centre. */}
          <TalkToSomeone />
          {RIGHT_TABS.map((t) => (
            <Tab key={t.href} tab={t} pathname={pathname} />
          ))}
        </div>
      </nav>
    </PhoneFrame>
  );
}
