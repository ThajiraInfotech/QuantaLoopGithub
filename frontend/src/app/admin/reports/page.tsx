import type { Metadata } from "next";
import { Suspense } from "react";

import { AdminReportsPanel } from "@/components/admin/admin-reports-panel";

export const metadata: Metadata = {
  title: "Reports",
};

export default function AdminReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl py-8">
          <div className="h-40 animate-pulse rounded-xl border border-zinc-200/80 bg-zinc-50" />
        </div>
      }
    >
      <AdminReportsPanel />
    </Suspense>
  );
}
