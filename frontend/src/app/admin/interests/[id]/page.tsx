import type { Metadata } from "next";

import { AdminInterestDetailView } from "@/components/admin/admin-interest-detail";

export const metadata: Metadata = {
  title: "Interest detail",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminInterestDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <AdminInterestDetailView interestId={id} />;
}
