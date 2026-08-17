import type { Metadata } from "next";
import { Suspense } from "react";

import { AdminMaterialsPanel } from "@/components/admin/admin-materials-panel";

export const metadata: Metadata = {
  title: "Materials",
};

export default function AdminMaterialsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl py-8">
          <div className="h-40 animate-pulse rounded-xl border border-zinc-200/80 bg-zinc-50" />
        </div>
      }
    >
      <AdminMaterialsPanel />
    </Suspense>
  );
}
