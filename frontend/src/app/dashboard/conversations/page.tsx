import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ConversationsIndexPage } from "@/components/conversations/conversations-index-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard.conversations");
  return { title: t("title") };
}

export default function ConversationsDashboardPage() {
  return <ConversationsIndexPage />;
}
