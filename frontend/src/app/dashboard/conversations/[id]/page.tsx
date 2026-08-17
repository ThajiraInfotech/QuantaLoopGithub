"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

import { ConversationRoomPage } from "@/components/conversations/conversation-room-page";

export default function ConversationDetailPage() {
  const t = useTranslations("dashboard.conversations");
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  if (!id) {
    return (
      <p className="text-sm text-zinc-600">{t("invalidReference")}</p>
    );
  }

  return <ConversationRoomPage conversationId={id} />;
}
