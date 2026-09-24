"use client";

/**
 * In-page "back" for the visit sub-views. Sits where BackLink sits on the other
 * Care pages, but keeps a 44px touch target.
 */
export function BackButton({
  onClick,
  label = "All visits",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="-mt-2 -mb-3 inline-flex min-h-11 items-center gap-1 rounded-lg text-[14px] font-medium text-sage-dark focus-visible:ring-2 focus-visible:ring-sage/40 focus-visible:outline-none"
    >
      <span aria-hidden>‹</span> {label}
    </button>
  );
}
