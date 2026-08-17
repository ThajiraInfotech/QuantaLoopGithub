"use client";

import { createContext, useContext } from "react";

import type { SubscriptionAccessState } from "@/types/subscription";

const SubscriptionAccessContext = createContext<SubscriptionAccessState | null>(
  null
);

/** Shares the entitlement the guard already confirmed, so nothing refetches it. */
export function SubscriptionAccessProvider({
  access,
  children,
}: {
  access: SubscriptionAccessState | null;
  children: React.ReactNode;
}) {
  return (
    <SubscriptionAccessContext.Provider value={access}>
      {children}
    </SubscriptionAccessContext.Provider>
  );
}

export function useSubscriptionAccess(): SubscriptionAccessState | null {
  return useContext(SubscriptionAccessContext);
}
