import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";

/** Network overview is deferred from MVP. Old links land on the dashboard. */
export default function NetworkDashboardRedirect() {
  redirect(ROUTES.dashboard);
}
