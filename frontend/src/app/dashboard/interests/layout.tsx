import { Suspense } from "react";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Interests",
};

export default function InterestsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl space-y-4 py-8">
          <div className="h-10 w-1/2 animate-pulse rounded-md bg-zinc-100" />
          <div className="h-32 animate-pulse rounded-xl border border-zinc-200/80 bg-zinc-50" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
