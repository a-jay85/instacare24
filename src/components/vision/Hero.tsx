import { PRICE_MONTHLY } from "@/lib/config";
import { LinkButton } from "./Section";

export function Hero() {
  return (
    <header className="relative overflow-hidden bg-[radial-gradient(900px_circle_at_10%_0%,rgba(63,122,110,0.16),transparent_60%),radial-gradient(700px_circle_at_100%_100%,rgba(176,69,60,0.08),transparent_55%)]">
      <div className="mx-auto max-w-6xl px-6 pt-16 pb-20 md:pt-24 md:pb-28 lg:px-10">
        <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-sage-dark">
          InstaCare24 · Why this wins
        </p>
        <h1 className="mt-5 max-w-4xl font-serif text-[44px] leading-[1.05] text-ink md:text-[64px]">
          One call out, one update back.
        </h1>
        <p className="mt-6 max-w-2xl text-[19px] leading-relaxed text-muted md:text-[21px]">
          A reliable daily human touchpoint for an aging parent, and an honest
          daily update for her adult child, at a cost that supports $
          {PRICE_MONTHLY} a month.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <LinkButton href="/demo">See the family app</LinkButton>
          <LinkButton href="/console" variant="secondary">
            Open the staff console
          </LinkButton>
        </div>
        <p className="mt-6 text-[14px] text-muted">
          Working prototype. Scripted data, no real calls, no real AI.
        </p>
      </div>
    </header>
  );
}
