import type { Metadata } from "next";
import { Suspense } from "react";

import { AdminParticipantRecordsPanel } from "@/components/admin/admin-participant-records-panel";

export const metadata: Metadata = {
  title: "Discussions",
};

export default function AdminDiscussionsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl py-8">
          <div className="h-40 animate-pulse rounded-xl border border-zinc-200/80 bg-zinc-50" />
        </div>
      }
    >
      <AdminParticipantRecordsPanel
        kind="discussions"
        title="Participant discussions"
        description="Conversation threads"
      />
    </Suspense>
  );
}
