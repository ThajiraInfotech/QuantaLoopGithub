"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import toast from "react-hot-toast";

import { MaterialCreateForm } from "@/components/forms/material-create-form";
import { ROUTES } from "@/constants/routes";
import { canPublishMaterial } from "@/lib/auth/permissions";
import { useAuthStore } from "@/store/auth-store";

export default function NewMaterialPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const duplicateFromId = searchParams.get("duplicate") ?? undefined;
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) return;
    if (!canPublishMaterial(user)) {
      toast.error("Your role can view materials but not publish availability.");
      router.replace(ROUTES.materials);
    }
  }, [router, user]);

  if (!user || !canPublishMaterial(user)) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-sm text-zinc-500">
        Checking permissions…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <MaterialCreateForm duplicateFromId={duplicateFromId} />
    </div>
  );
}
