import type { Metadata } from "next";

import { AdminSupportRequestDetailView } from "@/components/admin/admin-support-request-detail";

export const metadata: Metadata = {
  title: "Support request",
};

type AdminSupportDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminSupportDetailPage({
  params,
}: AdminSupportDetailPageProps) {
  const { id } = await params;
  return <AdminSupportRequestDetailView requestId={id} />;
}
