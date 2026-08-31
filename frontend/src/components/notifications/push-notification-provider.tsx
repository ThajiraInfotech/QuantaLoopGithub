"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getPushPermission,
  getPushSubscription,
  isPushSupported,
  pushSubscriptionToPayload,
  subscribeToBrowserPush,
  unsubscribeFromBrowserPush,
} from "@/lib/web-push";
import {
  fetchPushConfig,
  subscribePushRequest,
  unsubscribePushRequest,
} from "@/services/notifications/notification.service";
import { useAuthStore } from "@/store/auth-store";
import { PushNotificationModal } from "@/components/notifications/push-notification-modal";

type PushNotificationContextValue = {
  supported: boolean;
  enabled: boolean;
  subscribed: boolean;
  permission: NotificationPermission | "unsupported";
  configLoading: boolean;
  loading: boolean;
  promptDismissedThisSession: boolean;
  dismissPromptForSession: () => void;
  enablePush: () => Promise<boolean>;
  disablePush: () => Promise<boolean>;
  refresh: () => Promise<void>;
};

const PushNotificationContext =
  createContext<PushNotificationContextValue | null>(null);

export function usePushNotifications(): PushNotificationContextValue {
  const ctx = useContext(PushNotificationContext);
  if (!ctx) {
    throw new Error("usePushNotifications must be used within PushNotificationProvider");
  }
  return ctx;
}

export function PushNotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useAuthStore((s) => s.user);
  const supported = isPushSupported();
  const [enabled, setEnabled] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [permission, setPermission] = useState<
    NotificationPermission | "unsupported"
  >(getPushPermission());
  const [loading, setLoading] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [promptDismissedThisSession, setPromptDismissedThisSession] =
    useState(false);

  // Show the enable prompt again on every fresh login until push is activated.
  useEffect(() => {
    setPromptDismissedThisSession(false);
  }, [user?.id]);

  const dismissPromptForSession = useCallback(() => {
    setPromptDismissedThisSession(true);
  }, []);

  const refresh = useCallback(async () => {
    if (!user || !supported) {
      setEnabled(false);
      setSubscribed(false);
      setPublicKey(null);
      setPermission(getPushPermission());
      setConfigLoading(false);
      return;
    }

    setConfigLoading(true);
    setPermission(getPushPermission());

    try {
      const config = await fetchPushConfig();
      setEnabled(config.enabled);
      setPublicKey(config.publicKey);
      setSubscribed(config.subscribed);

      if (
        config.enabled &&
        config.publicKey &&
        getPushPermission() === "granted"
      ) {
        const browserSub = await getPushSubscription();
        if (browserSub && !config.subscribed) {
          await subscribePushRequest(pushSubscriptionToPayload(browserSub));
          setSubscribed(true);
        }
      }
    } catch {
      setEnabled(false);
      setSubscribed(false);
    } finally {
      setConfigLoading(false);
    }
  }, [supported, user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const enablePush = useCallback(async () => {
    if (!supported || !publicKey) return false;

    setLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") return false;

      const subscription = await subscribeToBrowserPush(publicKey);
      if (!subscription) return false;

      await subscribePushRequest(pushSubscriptionToPayload(subscription));
      setSubscribed(true);
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }, [publicKey, supported]);

  const disablePush = useCallback(async () => {
    setLoading(true);
    try {
      const subscription = await getPushSubscription();
      if (subscription) {
        await unsubscribePushRequest(subscription.endpoint);
        await unsubscribeFromBrowserPush();
      }
      setSubscribed(false);
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      supported,
      enabled,
      subscribed,
      permission,
      configLoading,
      loading,
      promptDismissedThisSession,
      dismissPromptForSession,
      enablePush,
      disablePush,
      refresh,
    }),
    [
      supported,
      enabled,
      subscribed,
      permission,
      configLoading,
      loading,
      promptDismissedThisSession,
      dismissPromptForSession,
      enablePush,
      disablePush,
      refresh,
    ]
  );

  return (
    <PushNotificationContext.Provider value={value}>
      {children}
      <PushNotificationModal />
    </PushNotificationContext.Provider>
  );
}
