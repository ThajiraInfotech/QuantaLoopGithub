import type { Metadata } from "next";

import { NotificationCenter } from "@/components/notifications/notification-center";

export const metadata: Metadata = {
  title: "Notifications",
};

export default function NotificationsDashboardPage() {
  return <NotificationCenter />;
}
