import type { Metadata } from "next";

import { AdminInsightsPanel } from "@/components/admin/admin-insights-panel";

export const metadata: Metadata = {
  title: "Public Insights",
};

export default function AdminInsightsPage() {
  return <AdminInsightsPanel />;
}
