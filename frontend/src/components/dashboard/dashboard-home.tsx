"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { BuyerDashboardHome } from "@/components/dashboard/buyer-dashboard-home";
import { ProviderDashboardHome } from "@/components/dashboard/provider-dashboard-home";
import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/store/auth-store";

export function DashboardHome() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const role = user?.role;

  useEffect(() => {
    if (role === "admin") {
      router.replace(ROUTES.admin);
    }
  }, [role, router]);

  if (role === "admin") {
    return null;
  }

  if (role === "material_provider") {
    return <ProviderDashboardHome />;
  }

  if (role === "verified_buyer") {
    return <BuyerDashboardHome />;
  }

  return null;
}
