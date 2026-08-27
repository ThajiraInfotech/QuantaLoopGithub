"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { ReportActions } from "@/components/reports/report-actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLocalizedTime } from "@/hooks/use-localized-time";
import { ROUTES } from "@/constants/routes";
import {
  fetchConversationById,
  fetchConversationMessages,
  postMessageRequest,
} from "@/services/conversations/conversation.service";
import { useAuthStore } from "@/store/auth-store";
import type { Conversation } from "@/types/conversation";
import type { ThreadMessage } from "@/types/conversation";

export function ConversationRoomPage({
  conversationId,
}: {
  conversationId: string;
}) {
  const t = useTranslations("dashboard.conversations");
  const tReport = useTranslations("reports");
  const { formatRelativeTime } = useLocalizedTime();
  const user = useAuthStore((s) => s.user);
  const [conv, setConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [c, m] = await Promise.all([
        fetchConversationById(conversationId),
        fetchConversationMessages(conversationId),
      ]);
      setConv(c);
      setMessages(m.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("roomLoadError"));
    } finally {
      setLoading(false);
    }
  }, [conversationId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function send() {
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    try {
      await postMessageRequest({ conversationId, content: text });
      setDraft("");
      await load();
    } catch {
      /* surface inline */
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-3 py-8">
        <div className="h-10 w-2/3 animate-pulse rounded-md bg-zinc-100" />
        <div className="h-48 animate-pulse rounded-xl border border-zinc-200/80 bg-zinc-50" />
      </div>
    );
  }

  if (error || !conv) {
    return (
      <p className="text-sm text-red-700" role="alert">
        {error ?? t("roomUnavailable")}
      </p>
    );
  }

  const canWrite =
    user &&
    user.role !== "admin" &&
    (user.id === conv.providerId || user.id === conv.buyerId) &&
    conv.status === "active";

  const counterpartyId =
    user?.id === conv.buyerId
      ? conv.providerId
      : user?.id === conv.providerId
        ? conv.buyerId
        : null;
  const reportingBuyer = user?.id === conv.providerId;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 pb-8">
      <div>
        <Link
          href={ROUTES.conversations}
          className="text-xs font-medium text-zinc-600 underline-offset-4 hover:underline"
        >
          {t("backToAll")}
        </Link>
        <h1 className="mt-3 text-xl font-semibold tracking-tight text-zinc-900">
          {conv.materialTitle}
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          {conv.status === "closed" ? t("closedThread") : t("activeCoordination")} ·
          {t("roomSubtitle")}
        </p>
        {counterpartyId ? (
          <ReportActions
            className="mt-3"
            items={[
              {
                label: reportingBuyer
                  ? tReport("actions.buyer")
                  : tReport("actions.provider"),
                targetType: "participant",
                targetUserId: counterpartyId,
                subjectLabel: t("reportSubject"),
                contextNote: t("reportContext", { title: conv.materialTitle }),
              },
            ]}
          />
        ) : null}
      </div>

      <div className="space-y-3 rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm shadow-zinc-950/5">
        {messages.length === 0 ? (
          <p className="text-sm text-zinc-500">{t("messagesEmpty")}</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className="rounded-lg border border-zinc-100 bg-zinc-50/60 px-3 py-2.5"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-xs font-semibold text-zinc-800">
                  {msg.isSystem
                    ? t("system")
                    : msg.senderCompany || msg.senderName || t("participant")}
                </span>
                <span className="text-[10px] uppercase tracking-wide text-zinc-400">
                  {formatRelativeTime(msg.createdAt)}
                </span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">
                {msg.content}
              </p>
            </div>
          ))
        )}
      </div>

      {canWrite ? (
        <div className="sticky bottom-0 z-10 mt-6 border-t border-zinc-200 bg-zinc-50/95 pt-4 backdrop-blur-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={2}
              placeholder={t("placeholder")}
              className="min-h-[72px] flex-1 resize-none border-zinc-200 bg-white text-sm"
            />
            <Button
              type="button"
              className="shrink-0 sm:mb-0.5"
              disabled={sending || !draft.trim()}
              onClick={() => void send()}
            >
              {sending ? t("sending") : t("send")}
            </Button>
          </div>
        </div>
      ) : user?.role === "admin" ? (
        <p className="text-xs text-zinc-500">{t("adminReadOnly")}</p>
      ) : conv.status !== "active" ? (
        <p className="text-xs text-zinc-500">{t("threadClosed")}</p>
      ) : null}
    </div>
  );
}
