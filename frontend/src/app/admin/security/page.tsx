import type { Metadata } from "next";

import { AdminChangePasswordPanel } from "@/components/admin/admin-change-password-panel";

export const metadata: Metadata = {
  title: "Security",
};

export default function AdminSecurityPage() {
  return <AdminChangePasswordPanel />;
}
