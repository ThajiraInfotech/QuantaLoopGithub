"use client";

import { BellRing, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import toast from "react-hot-toast";

import { usePushNotifications } from "@/components/notifications/push-notification-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PushNotificationPromptProps = {
  className?: string;
  variant?: "banner" | "compact";
};

export function PushNotificationPrompt({
  className,
  variant = "banner",
}: PushNotificationPromptProps) {
  const t = useTranslations("notifications.push");
  const {
    supported,
    enabled,
    subscribed,
    loading,
    promptDismissedThisSession,
    dismissPromptForSession,
    enablePush,
  } = usePushNotifications();
  const [enabling, setEnabling] = useState(false);

  if (
    !supported ||
    !enabled ||
    subscribed ||
    promptDismissedThisSession
  ) {
    return null;
  }

  async function handleEnable() {
    setEnabling(true);
    try {
      const ok = await enablePush();
      if (ok) {
        toast.success(t("enableSuccess"));
      } else if (Notification.permission === "denied") {
        toast.error(t("deniedHint"));
      } else {
        toast.error(t("enableError"));
      }
    } finally {
      setEnabling(false);
    }
  }

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-3 border-t border-zinc-100 px-3 py-2.5",
          className
        )}
      >
        <p className="text-xs text-zinc-600">{t("compactHint")}</p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={loading || enabling}
          onClick={() => void handleEnable()}
        >
          {enabling ? t("enabling") : t("enable")}
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative rounded-xl border border-emerald-200/80 bg-emerald-50/70 px-4 py-4 sm:px-5",
        className
      )}
    >
      <button
        type="button"
        onClick={dismissPromptForSession}
        className="absolute right-3 top-3 rounded-md p-1 text-zinc-400 hover:bg-white/70 hover:text-zinc-600"
        aria-label={t("dismiss")}
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
      <div className="flex items-start gap-3 pr-8">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <BellRing className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 space-y-3">
          <div>
            <p className="text-sm font-semibold text-zinc-900">{t("title")}</p>
            <p className="mt-1 text-sm leading-relaxed text-zinc-600">
              {t("description")}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            disabled={loading || enabling}
            onClick={() => void handleEnable()}
          >
            {enabling ? t("enabling") : t("enable")}
          </Button>
        </div>
      </div>
    </div>
  );
}
