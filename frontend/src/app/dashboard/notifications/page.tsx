import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";

/** Notifications live in the header bell. Old links land on the dashboard. */
export default function NotificationsDashboardRedirect() {
  redirect(ROUTES.dashboard);
}
