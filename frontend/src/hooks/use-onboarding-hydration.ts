"use client";

import { useEffect, useState } from "react";

import { useOnboardingStore } from "@/store/onboarding-store";

export function useOnboardingHydration() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const persistApi = useOnboardingStore.persist;
    if (!persistApi) {
      queueMicrotask(() => {
        setHydrated(true);
      });
      return;
    }

    const unsub = persistApi.onFinishHydration(() => {
      setHydrated(true);
    });
    queueMicrotask(() => {
      if (persistApi.hasHydrated()) {
        setHydrated(true);
      }
    });
    return unsub;
  }, []);

  return hydrated;
}
