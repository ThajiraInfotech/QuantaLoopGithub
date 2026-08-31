"use client";

import { BellOff, BellRing } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { usePushNotifications } from "@/components/notifications/push-notification-provider";
import { Button } from "@/components/ui/button";
import { getPushPermission } from "@/lib/web-push";

/**
 * Dashboard popup for browser push. Shown on every login until subscribed.
 * If the user blocked notifications in the browser, shows unblock instructions.
 */
export function PushNotificationModal() {
  const t = useTranslations("notifications.push");
  const {
    supported,
    enabled,
    subscribed,
    permission,
    configLoading,
    loading,
    promptDismissedThisSession,
    dismissPromptForSession,
    enablePush,
    refresh,
  } = usePushNotifications();
  const [open, setOpen] = useState(false);
  const [enabling, setEnabling] = useState(false);
  const [livePermission, setLivePermission] = useState(permission);

  const blocked = livePermission === "denied";

  useEffect(() => {
    setLivePermission(permission);
  }, [permission]);

  useEffect(() => {
    if (
      configLoading ||
      promptDismissedThisSession ||
      !supported ||
      !enabled ||
      subscribed
    ) {
      setOpen(false);
      return;
    }

    const timer = window.setTimeout(() => setOpen(true), 1500);
    return () => window.clearTimeout(timer);
  }, [
    configLoading,
    promptDismissedThisSession,
    supported,
    enabled,
    subscribed,
    livePermission,
  ]);

  if (!open) return null;

  function handleNotNow() {
    dismissPromptForSession();
    setOpen(false);
  }

  async function handleEnable() {
    setEnabling(true);
    try {
      const ok = await enablePush();
      if (ok) {
        toast.success(t("enableSuccess"));
        setOpen(false);
        return;
      }
      const current = getPushPermission();
      setLivePermission(current);
      if (current === "denied") {
        toast.error(t("deniedHint"));
      } else {
        toast.error(t("enableError"));
      }
    } finally {
      setEnabling(false);
    }
  }

  async function handleTryAgain() {
    setEnabling(true);
    try {
      await refresh();
      const current = getPushPermission();
      setLivePermission(current);

      if (current === "denied") {
        toast.error(t("deniedStillBlocked"));
        return;
      }

      if (current === "granted") {
        const ok = await enablePush();
        if (ok) {
          toast.success(t("enableSuccess"));
          setOpen(false);
        } else {
          toast.error(t("enableError"));
        }
        return;
      }

      await handleEnable();
    } finally {
      setEnabling(false);
    }
  }

  function handleReload() {
    window.location.reload();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-zinc-950/50 backdrop-blur-[2px]"
        aria-label={t("notNow")}
        onClick={handleNotNow}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="push-notification-modal-title"
        className="relative z-10 w-full max-w-md overflow-hidden rounded-t-2xl border border-zinc-200/90 bg-white shadow-2xl shadow-zinc-950/20 sm:rounded-2xl"
      >
        <div
          className={
            blocked
              ? "border-b border-amber-100 bg-gradient-to-br from-amber-50 to-white px-6 py-6"
              : "border-b border-emerald-100 bg-gradient-to-br from-emerald-50 to-white px-6 py-6"
          }
        >
          <div
            className={
              blocked
                ? "mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700"
                : "mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700"
            }
          >
            {blocked ? (
              <BellOff className="h-7 w-7" aria-hidden />
            ) : (
              <BellRing className="h-7 w-7" aria-hidden />
            )}
          </div>
          <h2
            id="push-notification-modal-title"
            className="mt-4 text-center text-xl font-semibold tracking-tight text-zinc-900"
          >
            {blocked ? t("deniedModalTitle") : t("modalTitle")}
          </h2>
          <p className="mt-2 text-center text-sm leading-relaxed text-zinc-600">
            {blocked ? t("deniedModalDescription") : t("modalDescription")}
          </p>
        </div>

        {blocked ? (
          <div className="space-y-3 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {t("deniedStepsTitle")}
            </p>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-zinc-700">
              <li>{t("deniedStep1")}</li>
              <li>{t("deniedStep2")}</li>
              <li>{t("deniedStep3")}</li>
            </ol>
            <p className="text-xs text-zinc-500">{t("deniedIncognitoNote")}</p>
          </div>
        ) : (
          <div className="space-y-2 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {t("modalBenefitsTitle")}
            </p>
            <ul className="space-y-2 text-sm text-zinc-700">
              <li className="flex gap-2">
                <span className="text-emerald-600" aria-hidden>
                  •
                </span>
                {t("modalBenefit1")}
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-600" aria-hidden>
                  •
                </span>
                {t("modalBenefit2")}
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-600" aria-hidden>
                  •
                </span>
                {t("modalBenefit3")}
              </li>
            </ul>
          </div>
        )}

        <div className="flex flex-col gap-2 border-t border-zinc-100 bg-zinc-50/80 px-6 py-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            className="order-2 sm:order-1"
            disabled={loading || enabling}
            onClick={handleNotNow}
          >
            {t("notNow")}
          </Button>
          {blocked ? (
            <>
              <Button
                type="button"
                variant="outline"
                className="order-1 sm:order-2"
                disabled={loading || enabling}
                onClick={handleReload}
              >
                {t("reloadPage")}
              </Button>
              <Button
                type="button"
                className="order-0 sm:order-3"
                disabled={loading || enabling}
                onClick={() => void handleTryAgain()}
              >
                {enabling ? t("enabling") : t("tryAgain")}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              className="order-1 sm:order-2"
              disabled={loading || enabling}
              onClick={() => void handleEnable()}
            >
              {enabling ? t("enabling") : t("modalEnable")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
