import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";

/** Activity feed is deferred from MVP. Old links land on the dashboard. */
export default function ActivityDashboardRedirect() {
  redirect(ROUTES.dashboard);
}
