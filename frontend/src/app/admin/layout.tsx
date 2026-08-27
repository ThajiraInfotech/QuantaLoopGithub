import type { Metadata } from "next";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { RequireAuth } from "@/components/shared/require-auth";
import { RequireRole } from "@/components/shared/require-role";
import { NOINDEX_ROBOTS } from "@/lib/seo";

export const dynamic = "force-dynamic";

/** Private admin — strip marketing SEO / keep crawlers out. */
export const metadata: Metadata = {
  robots: NOINDEX_ROBOTS,
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth>
      <RequireRole roles={["admin"]}>
        <DashboardShell>{children}</DashboardShell>
      </RequireRole>
    </RequireAuth>
  );
}
