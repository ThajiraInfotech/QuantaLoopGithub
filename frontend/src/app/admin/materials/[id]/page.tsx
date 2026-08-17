import type { Metadata } from "next";

import { AdminMaterialDetailView } from "@/components/admin/admin-material-detail";

export const metadata: Metadata = {
  title: "Material detail",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminMaterialDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <AdminMaterialDetailView materialId={id} />;
}
