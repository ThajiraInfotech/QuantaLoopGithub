import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { NetworkOverviewPage } from "@/components/network/network-overview-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard.network");
  return { title: t("title") };
}

export default function NetworkDashboardPage() {
  return <NetworkOverviewPage />;
}
