import type { Metadata } from "next";

import { AdminDashboardHome } from "@/components/admin/admin-dashboard-home";

export const metadata: Metadata = {
  title: "Admin Dashboard",
};

export default function AdminDashboardPage() {
  return <AdminDashboardHome />;
}
