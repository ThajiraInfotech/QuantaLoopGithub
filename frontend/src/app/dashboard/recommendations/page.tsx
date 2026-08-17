import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { RecommendationsPage } from "@/components/recommendations/recommendations-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard.recommendations");
  return { title: t("title") };
}

export default function RecommendationsDashboardPage() {
  return <RecommendationsPage />;
}
