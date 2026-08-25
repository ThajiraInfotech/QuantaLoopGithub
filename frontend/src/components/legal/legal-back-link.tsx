"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ROUTES } from "@/constants/routes";

function canUseHistoryBack(): boolean {
  if (typeof window === "undefined") return false;
  if (window.history.length <= 1) return false;
  try {
    const referrer = document.referrer;
    if (!referrer) return window.history.length > 1;
    return new URL(referrer).origin === window.location.origin;
  } catch {
    return window.history.length > 1;
  }
}

export function LegalBackLink() {
  const t = useTranslations("legal.common");
  const router = useRouter();
  const [useHistoryBack, setUseHistoryBack] = useState(false);

  useEffect(() => {
    setUseHistoryBack(canUseHistoryBack());
  }, []);

  function handleBack() {
    if (canUseHistoryBack()) {
      router.back();
      return;
    }
    router.push(ROUTES.home);
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className="text-small font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      {useHistoryBack ? t("back") : t("backToHome")}
    </button>
  );
}
