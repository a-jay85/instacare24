"use client";

import Link from "next/link";
import type { ReactNode } from "react";

/** One large tappable card on the Care hub. The whole card is the link. */
export function HubCard({
  href,
  title,
  icon,
  headline,
  detail,
  badge,
}: {
  href: string;
  title: string;
  icon: ReactNode;
  headline: ReactNode;
  detail?: ReactNode;
  badge?: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-sage/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/40"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-sage-soft text-sage-dark">
            {icon}
          </span>
          <span className="text-[16px] font-semibold text-ink">{title}</span>
        </span>
        <span className="flex items-center gap-2">
          {badge}
          <span aria-hidden className="text-[20px] leading-none text-faint">
            ›
          </span>
        </span>
      </div>
      <p className="mt-3 text-[15px] leading-relaxed text-ink">{headline}</p>
      {detail ? (
        <p className="mt-1 text-[13px] leading-snug text-muted">{detail}</p>
      ) : null}
    </Link>
  );
}

const ICON = "h-[18px] w-[18px] fill-current";

export const PILL_ICON = (
  <svg viewBox="0 0 20 20" aria-hidden className={ICON}>
    <path d="M12.9 3.1a4 4 0 0 1 5.7 5.7l-9.8 9.8a4 4 0 0 1-5.7-5.7l9.8-9.8Zm-3.5 6.3-4.9 4.9a2 2 0 1 0 2.8 2.8l4.9-4.9-2.8-2.8Z" />
  </svg>
);

export const DOCTOR_ICON = (
  <svg viewBox="0 0 20 20" aria-hidden className={ICON}>
    <path d="M6 2.5a1 1 0 0 1 1 1V8a3 3 0 0 0 6 0V3.5a1 1 0 1 1 2 0V8a5 5 0 0 1-4 4.9v1.6a2 2 0 1 0 4 0v-.8a2.2 2.2 0 1 1 2 0v.8a4 4 0 1 1-8 0v-1.6A5 5 0 0 1 5 8V3.5a1 1 0 0 1 1-1Z" />
  </svg>
);

export const SHIELD_ICON = (
  <svg viewBox="0 0 20 20" aria-hidden className={ICON}>
    <path d="M10 1.8 3.5 4.3v5c0 4.2 2.8 7.4 6.5 8.9 3.7-1.5 6.5-4.7 6.5-8.9v-5L10 1.8Zm2.9 6.6-3.6 3.8a.8.8 0 0 1-1.1 0L6.6 10.6a.8.8 0 1 1 1.1-1.1l1 1 3-3.2a.8.8 0 1 1 1.2 1.1Z" />
  </svg>
);
