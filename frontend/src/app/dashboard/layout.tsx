import type { Metadata } from "next";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { RequireAuth } from "@/components/shared/require-auth";
import { SubscriptionAccessGuard } from "@/components/subscriptions/subscription-access-guard";
import { NOINDEX_ROBOTS } from "@/lib/seo";

export const dynamic = "force-dynamic";

/** Private app — strip marketing SEO / keep crawlers out. */
export const metadata: Metadata = {
  robots: NOINDEX_ROBOTS,
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth>
      <SubscriptionAccessGuard>
        <DashboardShell>{children}</DashboardShell>
      </SubscriptionAccessGuard>
    </RequireAuth>
  );
}
