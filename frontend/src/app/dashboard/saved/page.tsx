import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { SavedOpportunitiesPage } from "@/components/saved/saved-opportunities-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard.saved");
  return { title: t("title") };
}

export default function SavedDashboardPage() {
  return <SavedOpportunitiesPage />;
}
