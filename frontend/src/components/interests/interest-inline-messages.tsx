"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { ReportActions } from "@/components/reports/report-actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLocalizedTime } from "@/hooks/use-localized-time";
import {
  fetchConversationMessages,
  postMessageRequest,
} from "@/services/conversations/conversation.service";
import { fetchUnreadNotificationCount } from "@/services/notifications/notification.service";
import { useAuthStore } from "@/store/auth-store";
import { useNotificationStore } from "@/store/notification-store";
import type { ThreadMessage } from "@/types/conversation";

type InterestInlineMessagesProps = {
  conversationId: string;
  threadClosed?: boolean;
  counterpartyId?: string | null;
  counterpartyLabel?: string;
  materialTitle?: string;
  onMessageSent?: () => void;
};

export function InterestInlineMessages({
  conversationId,
  threadClosed = false,
  counterpartyId,
  counterpartyLabel,
  materialTitle,
  onMessageSent,
}: InterestInlineMessagesProps) {
  const t = useTranslations("conversations.messages");
  const { formatRelativeTime } = useLocalizedTime();
  const user = useAuthStore((s) => s.user);
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const participantFallback = counterpartyLabel ?? t("participant");

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const { items } = await fetchConversationMessages(conversationId);
      setMessages(items);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  async function send() {
    const text = draft.trim();
    if (!text || threadClosed) return;
    setSending(true);
    try {
      await postMessageRequest({ conversationId, content: text });
      setDraft("");
      await loadMessages();
      onMessageSent?.();
      try {
        const n = await fetchUnreadNotificationCount();
        setUnreadCount(n);
      } catch {
        /* badge refresh is best-effort */
      }
    } finally {
      setSending(false);
    }
  }

  const canWrite = Boolean(user && user.role !== "admin" && !threadClosed);

  return (
    <div className="space-y-3 rounded-lg border border-zinc-200/80 bg-zinc-50/50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {t("heading")}
      </p>

      {loading ? (
        <div className="h-16 animate-pulse rounded-md bg-zinc-100" />
      ) : messages.length === 0 ? (
        <p className="text-sm text-zinc-500">{t("empty")}</p>
      ) : (
        <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
          {messages.map((msg) => {
            const isMine = msg.senderId === user?.id;
            return (
              <li
                key={msg.id}
                className={
                  isMine
                    ? "ml-6 rounded-lg border border-zinc-200 bg-white px-3 py-2"
                    : "mr-6 rounded-lg border border-zinc-100 bg-white px-3 py-2"
                }
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold text-zinc-800">
                    {msg.isSystem
                      ? t("system")
                      : msg.senderCompany || msg.senderName || t("participant")}
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    {formatRelativeTime(msg.createdAt)}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">
                  {msg.content}
                </p>
              </li>
            );
          })}
        </ul>
      )}

      {canWrite ? (
        <div className="flex flex-col gap-2 border-t border-zinc-200/80 pt-3 sm:flex-row sm:items-end">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            placeholder={t("placeholder")}
            className="min-h-[5.5rem] flex-1 resize-none border-zinc-200 bg-white text-base sm:min-h-[64px] sm:text-sm"
          />
          <Button
            type="button"
            className="h-12 w-full shrink-0 sm:h-9 sm:w-auto"
            disabled={sending || !draft.trim()}
            onClick={() => void send()}
          >
            {sending ? t("sending") : t("send")}
          </Button>
        </div>
      ) : threadClosed ? (
        <p className="text-xs text-zinc-500">{t("threadClosed")}</p>
      ) : null}

      {counterpartyId ? (
        <ReportActions
          className="border-t border-zinc-200/80 pt-3"
          items={[
            {
              label: t("reportParticipant"),
              targetType: "participant",
              targetUserId: counterpartyId,
              subjectLabel: participantFallback,
              contextNote: materialTitle
                ? `Reported from interest message thread (${materialTitle}).`
                : "Reported from interest message thread.",
            },
          ]}
        />
      ) : null}
    </div>
  );
}
