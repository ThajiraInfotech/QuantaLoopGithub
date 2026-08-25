"use client";

import { useParams } from "next/navigation";

import { MaterialDetailView } from "@/components/materials/material-detail-view";

export default function MaterialDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  if (!id) {
    return (
      <p className="text-sm leading-relaxed text-zinc-600">Invalid material reference.</p>
    );
  }

  return <MaterialDetailView materialId={id} />;
}
