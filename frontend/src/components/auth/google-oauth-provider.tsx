"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";

type GoogleOAuthProviderShellProps = {
  clientId?: string;
  children: React.ReactNode;
};

export function GoogleOAuthProviderShell({
  clientId,
  children,
}: GoogleOAuthProviderShellProps) {
  if (!clientId) {
    return <>{children}</>;
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider>
  );
}
