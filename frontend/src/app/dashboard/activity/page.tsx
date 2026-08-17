import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { DashboardActivityPage } from "@/components/activity/dashboard-activity-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard.activity");
  return { title: t("title") };
}

export default function ActivityDashboardPage() {
  return <DashboardActivityPage />;
}
