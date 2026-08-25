"use client";

import { useEffect, useRef } from "react";

/**
 * Keeps the current screen in history and runs `onBack` instead of leaving.
 * Used on unpaid signup steps so browser Back can discard the draft account
 * and return to the first onboarding screen.
 */
export function useInterceptBrowserBack(enabled: boolean, onBack: () => void) {
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  useEffect(() => {
    if (!enabled) return;

    window.history.pushState({ qlInterceptBack: true }, "");

    function onPopState() {
      window.history.pushState({ qlInterceptBack: true }, "");
      onBackRef.current();
    }

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [enabled]);
}
