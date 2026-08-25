import type { Metadata } from "next";

import { AdminInvoicesPanel } from "@/components/admin/admin-invoices-panel";

export const metadata: Metadata = {
  title: "Invoices",
};

export default function AdminInvoicesPage() {
  return <AdminInvoicesPanel />;
}
