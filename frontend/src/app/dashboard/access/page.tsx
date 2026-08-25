import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";

/** Access was a duplicate of membership payment. Old links land on the dashboard. */
export default function AccessDashboardRedirect() {
  redirect(ROUTES.dashboard);
}
