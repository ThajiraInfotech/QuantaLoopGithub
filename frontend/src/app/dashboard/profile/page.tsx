import type { Metadata } from "next";

import { CompanyProfilePage } from "@/components/profile/company-profile-page";

export const metadata: Metadata = {
  title: "Company profile",
};

export default function ProfileDashboardPage() {
  return <CompanyProfilePage />;
}
