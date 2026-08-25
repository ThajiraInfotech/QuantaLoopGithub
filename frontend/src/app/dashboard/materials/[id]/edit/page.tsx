"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import toast from "react-hot-toast";

import { MaterialEditForm } from "@/components/forms/material-edit-form";
import { ROUTES } from "@/constants/routes";
import { canPublishMaterial } from "@/lib/auth/permissions";
import { useAuthStore } from "@/store/auth-store";

export default function EditMaterialPage() {
  const params = useParams();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const id = typeof params.id === "string" ? params.id : "";

  useEffect(() => {
    if (!user) return;
    if (!canPublishMaterial(user)) {
      toast.error("You cannot edit materials in this role.");
      router.replace(ROUTES.materials);
    }
  }, [router, user]);

  if (!id) {
    return <p className="text-sm text-zinc-600">Invalid material reference.</p>;
  }

  if (!user || !canPublishMaterial(user)) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-sm text-zinc-500">
        Checking permissions…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href={ROUTES.materialDetail(id)}
        className="inline-flex min-h-11 items-center text-sm font-medium text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline"
      >
        ← Back to material
      </Link>
      <MaterialEditForm materialId={id} />
    </div>
  );
}
