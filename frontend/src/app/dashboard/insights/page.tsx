import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";

/** Dashboard operational Insights removed — public Insights hub only. */
export default function InsightsDashboardRedirectPage() {
  redirect(ROUTES.publicInsights);
}
