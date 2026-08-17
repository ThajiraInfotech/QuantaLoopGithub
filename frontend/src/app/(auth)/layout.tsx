import { AuthenticatedSessionRedirect } from "@/components/auth/authenticated-session-redirect";

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
