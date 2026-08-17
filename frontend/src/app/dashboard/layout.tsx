import { DashboardShell } from "@/components/layout/dashboard-shell";
import { RequireAuth } from "@/components/shared/require-auth";
import { SubscriptionAccessGuard } from "@/components/subscriptions/subscription-access-guard";

export const dynamic = "force-dynamic";

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
