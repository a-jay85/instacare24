"use client";

import { useState } from "react";
import { Card, Pill } from "@/components/ui";
import type { VisitSummary } from "@/lib/types";

export function visitDate(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

const SOURCE_LABEL: Record<VisitSummary["source"], string> = {
  audio: "Recorded",
  photo: "Photo",
  pdf: "PDF",
};

export function SourceIcon({
  source,
  className = "h-4 w-4",
}: {
  source: VisitSummary["source"];
  className?: string;
}) {
  const path =
    source === "audio"
      ? "M10 2.5a2.5 2.5 0 0 0-2.5 2.5v5a2.5 2.5 0 0 0 5 0V5A2.5 2.5 0 0 0 10 2.5ZM5 9.5a.75.75 0 0 0-1.5 0 6.5 6.5 0 0 0 5.75 6.46V17.5a.75.75 0 0 0 1.5 0v-1.54A6.5 6.5 0 0 0 16.5 9.5a.75.75 0 0 0-1.5 0 5 5 0 0 1-10 0Z"
      : source === "photo"
        ? "M7.4 3.5a1 1 0 0 0-.86.49L5.8 5.25H4A1.5 1.5 0 0 0 2.5 6.75v8A1.5 1.5 0 0 0 4 16.25h12a1.5 1.5 0 0 0 1.5-1.5v-8A1.5 1.5 0 0 0 16 5.25h-1.8l-.74-1.26a1 1 0 0 0-.86-.49H7.4ZM10 7.5a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z"
        : "M5.5 2.5A1.5 1.5 0 0 0 4 4v12a1.5 1.5 0 0 0 1.5 1.5h9A1.5 1.5 0 0 0 16 16V7.2a1.5 1.5 0 0 0-.44-1.06l-3.2-3.2a1.5 1.5 0 0 0-1.06-.44H5.5Zm1.75 8h5.5a.75.75 0 0 1 0 1.5h-5.5a.75.75 0 0 1 0-1.5Zm0 3h5.5a.75.75 0 0 1 0 1.5h-5.5a.75.75 0 0 1 0-1.5Z";
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden
      className={`${className} fill-current`}
    >
      <path d={path} />
    </svg>
  );
}

export function StatusPill({
  visit,
  specialistFirst,
}: {
  visit: VisitSummary;
  specialistFirst: string;
}) {
  if (visit.status === "processing")
    return <Pill tone="amber">Processing</Pill>;
  if (visit.status === "pending_review")
    return <Pill tone="amber">Being checked by {specialistFirst}</Pill>;
  return <Pill tone="moss">Ready</Pill>;
}

export function VisitList({
  visits,
  specialistFirst,
  onOpen,
}: {
  visits: VisitSummary[];
  specialistFirst: string;
  onOpen: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  // Epic 10, "Search & Retrieve Records": doctor, kind of visit, date or words.
  const sorted = [...visits]
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter(
      (v) =>
        !q ||
        [
          v.provider,
          v.specialty,
          visitDate(v.date),
          v.status === "ready" ? v.plain : "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(q),
    );
  return (
    <>
      <label className="mb-3 block">
        <span className="sr-only">Search visits</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by doctor, visit or word"
          className="min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-[15px] text-ink placeholder:text-faint focus-visible:ring-2 focus-visible:ring-sage/40 focus-visible:outline-none"
        />
      </label>
      {q && !sorted.length ? (
        <p className="text-[15px] text-muted" role="status">
          No visits match &ldquo;{query.trim()}&rdquo;.
        </p>
      ) : null}
      <ul className="space-y-3">
        {sorted.map((v) => {
          const ready = v.status === "ready";
          return (
            <li key={v.id}>
              <button
                type="button"
                onClick={() => onOpen(v.id)}
                disabled={!ready}
                aria-label={`${v.provider}, ${v.specialty}, ${visitDate(v.date)}${ready ? "" : ", summary on its way"}`}
                className="block w-full rounded-2xl text-left outline-none focus-visible:ring-2 focus-visible:ring-sage/40 disabled:cursor-default"
              >
                <Card
                  className={
                    ready ? "transition-colors hover:border-sage/40" : ""
                  }
                >
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
                    <span className="flex items-center gap-1.5 whitespace-nowrap text-[13px] font-medium text-muted">
                      <SourceIcon
                        source={v.source}
                        className="h-3.5 w-3.5 text-faint"
                      />
                      {visitDate(v.date)} · {SOURCE_LABEL[v.source]}
                    </span>
                    <span className="whitespace-nowrap">
                      <StatusPill visit={v} specialistFirst={specialistFirst} />
                    </span>
                  </div>
                  <p className="mt-2 text-[16px] font-medium text-ink">
                    {v.provider}
                    <span className="font-normal text-muted">
                      {" "}
                      · {v.specialty}
                    </span>
                  </p>
                  <p className="mt-1 line-clamp-2 text-[15px] leading-relaxed text-muted">
                    {ready && v.plain
                      ? v.plain
                      : v.status === "pending_review"
                        ? "Drafted. A person reads it before the family does. We will let you know when it is ready."
                        : "Summary on its way. We will let you know when it is ready."}
                  </p>
                </Card>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
