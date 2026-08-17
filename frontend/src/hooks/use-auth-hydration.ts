"use client";

import { useEffect, useState } from "react";

import { useAuthStore } from "@/store/auth-store";

export function useAuthHydration() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const persistApi = useAuthStore.persist;
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
