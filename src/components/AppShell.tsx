"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TalkToSomeone } from "./TalkToSomeone";

function Tab({
  href,
  label,
  active,
  icon,
}: {
  href: string;
  label: string;
  active: boolean;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-1 px-3 py-2 text-[11px] font-medium ${
        active ? "text-ink" : "text-faint"
      }`}
    >
      <span className="grid h-9 w-9 place-items-center">{icon}</span>
      {label}
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col">
      <header className="flex items-center justify-between px-5 pb-2 pt-5">
        <Link href="/feed" className="font-serif text-lg font-semibold text-ink">
          InstaCare<span className="text-sage">24</span>
        </Link>
        <Link href="/demo" className="text-[13px] text-faint hover:text-muted">
          Demo
        </Link>
      </header>

      <main className="flex-1 px-5 pb-28">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-lg items-center justify-around px-4 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
          <Tab
            href="/feed"
            label="Today"
            active={pathname === "/feed"}
            icon={
              <svg viewBox="0 0 20 20" aria-hidden className="h-5 w-5 fill-current">
                <path d="M10 2.2 2.5 8v9.3c0 .3.2.5.5.5h4.5v-5.2h5v5.2H17c.3 0 .5-.2.5-.5V8L10 2.2Z" />
              </svg>
            }
          />
          <TalkToSomeone />
          <Tab
            href="/profile"
            label="Profile"
            active={pathname === "/profile"}
            icon={
              <svg viewBox="0 0 20 20" aria-hidden className="h-5 w-5 fill-current">
                <path d="M10 10.2a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2ZM3.4 17.4c0-3 3-5.2 6.6-5.2s6.6 2.2 6.6 5.2v.1H3.4v-.1Z" />
              </svg>
            }
          />
        </div>
      </nav>
    </div>
  );
}
