import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { NetworkAccessPage } from "@/components/access/network-access-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard.access");
  return { title: t("title") };
}

export default function AccessDashboardPage() {
  return <NetworkAccessPage />;
}
