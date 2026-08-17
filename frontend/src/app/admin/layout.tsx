import { DashboardShell } from "@/components/layout/dashboard-shell";
import { RequireAuth } from "@/components/shared/require-auth";
import { RequireRole } from "@/components/shared/require-role";

export const dynamic = "force-dynamic";

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
