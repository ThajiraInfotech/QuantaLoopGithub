import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { InsightsPage } from "@/components/insights/insights-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard.insights");
  return { title: t("title") };
}

export default function InsightsDashboardPage() {
  return <InsightsPage />;
}
