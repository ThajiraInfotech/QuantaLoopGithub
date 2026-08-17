import type { Metadata } from "next";

import { AdminReportDetailView } from "@/components/admin/admin-report-detail";

export const metadata: Metadata = {
  title: "Report detail",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminReportDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <AdminReportDetailView reportId={id} />;
}
