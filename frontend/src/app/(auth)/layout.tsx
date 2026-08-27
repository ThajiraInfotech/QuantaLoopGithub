import type { Metadata } from "next";

import { AuthenticatedSessionRedirect } from "@/components/auth/authenticated-session-redirect";
import { NOINDEX_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = {
  robots: NOINDEX_ROBOTS,
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AuthenticatedSessionRedirect>{children}</AuthenticatedSessionRedirect>
    </div>
  );
}
