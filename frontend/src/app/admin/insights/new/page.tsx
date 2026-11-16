import type { Metadata } from "next";

import { AdminInsightForm } from "@/components/admin/admin-insight-form";

export const metadata: Metadata = {
  title: "New insight",
};

export default function AdminInsightNewPage() {
  return <AdminInsightForm />;
}
