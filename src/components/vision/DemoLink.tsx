"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useAccount } from "@/lib/store";

/**
 * A link into the live prototype. Family pages bounce to the landing page when
 * no family is loaded, so an investor arriving cold on /vision gets the Reyes
 * family loaded first. A family already in the browser is left alone.
 */
export function DemoLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const { account, loadSeed } = useAccount();
  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        if (!account) loadSeed("michael");
      }}
    >
      {children}
    </Link>
  );
}
