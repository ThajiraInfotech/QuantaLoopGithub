"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLocalizedTime } from "@/hooks/use-localized-time";
import { ROUTES } from "@/constants/routes";
import { fetchMyConversations } from "@/services/conversations/conversation.service";
import { useConversationStore } from "@/store/conversation-store";
import type { Conversation } from "@/types/conversation";

export function ConversationsIndexPage() {
  const t = useTranslations("dashboard.conversations");
  const { formatRelativeTime } = useLocalizedTime();
  const setStoreItems = useConversationStore((s) => s.setItems);
  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMyConversations();
      setItems(data);
      setStoreItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [setStoreItems, t]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-3 py-8">
        {[0, 1].map((k) => (
          <div
            key={k}
            className="h-24 animate-pulse rounded-xl border border-zinc-200/80 bg-zinc-50"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-red-700" role="alert">
        {error}
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          {t("indexTitle")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600">
          {t("indexSubtitle")}
        </p>
      </div>

      <ul className="space-y-3">
        {items.map((c) => (
          <li key={c.id}>
            <Link href={ROUTES.conversationDetail(c.id)}>
              <Card className="border-zinc-200/80 transition-colors hover:border-zinc-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{c.materialTitle}</CardTitle>
                  <CardDescription>
                    {c.status === "closed" ? t("statusClosed") : t("statusActive")} ·{" "}
                    {c.lastMessageAt
                      ? t("lastUpdate", {
                          time: formatRelativeTime(c.lastMessageAt),
                        })
                      : t("awaitingFirst")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-xs font-medium text-zinc-600">
                  {t("openThread")}
                </CardContent>
              </Card>
            </Link>
          </li>
        ))}
      </ul>

      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">{t("indexEmpty")}</p>
      ) : null}
    </div>
  );
}
