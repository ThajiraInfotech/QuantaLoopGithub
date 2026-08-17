import type { Metadata } from "next";

import { AdminParticipantDetailView } from "@/components/admin/admin-participant-detail";

export const metadata: Metadata = {
  title: "Participant detail",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminParticipantDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <AdminParticipantDetailView participantId={id} />;
}
