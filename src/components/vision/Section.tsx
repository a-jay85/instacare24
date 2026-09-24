import Link from "next/link";
import type { ReactNode } from "react";

/** Shared focus ring for every link on /vision. */
export const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2 focus-visible:ring-offset-cream";

/** One narrative section: eyebrow, serif h2, optional lede, then content. */
export function Section({
  id,
  eyebrow,
  title,
  lede,
  children,
  tinted,
}: {
  id: string;
  eyebrow: string;
  title: string;
  lede?: ReactNode;
  children: ReactNode;
  tinted?: boolean;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={`scroll-mt-20 border-t border-line ${tinted ? "bg-surface" : ""}`}
    >
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-20 lg:px-10">
        <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-sage-dark">
          {eyebrow}
        </p>
        <h2
          id={`${id}-title`}
          className="mt-3 max-w-3xl font-serif text-[30px] leading-tight text-ink md:text-[36px]"
        >
          {title}
        </h2>
        {lede ? (
          <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-muted">
            {lede}
          </p>
        ) : null}
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}

/** Navigation that looks like a button. Links, not router.push. */
export function LinkButton({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
}) {
  const styles =
    variant === "primary"
      ? "bg-sage text-white hover:bg-sage-dark"
      : "border border-line bg-surface text-ink hover:border-sage/40";
  return (
    <Link
      href={href}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-3 text-[15px] font-medium transition-colors ${styles} ${FOCUS}`}
    >
      {children}
    </Link>
  );
}

/** Small uppercase label used as the header of cards. */
export function Kicker({ children }: { children: ReactNode }) {
  return (
    <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
      {children}
    </p>
  );
}
