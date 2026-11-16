"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { AdminInsightForm } from "@/components/admin/admin-insight-form";
import { fetchAdminInsight } from "@/services/content-insights/content-insight.service";
import type { ContentInsight } from "@/types/content-insight";

export default function AdminInsightEditPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [insight, setInsight] = useState<ContentInsight | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const row = await fetchAdminInsight(id);
        if (!cancelled) setInsight(row);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load insight");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl py-8">
        <div className="h-40 animate-pulse rounded-xl border border-zinc-200/80 bg-zinc-50" />
      </div>
    );
  }

  if (error || !insight) {
    return (
      <div className="mx-auto max-w-3xl py-8">
        <p className="text-sm text-red-700" role="alert">
          {error ?? "Insight not found"}
        </p>
      </div>
    );
  }

  return <AdminInsightForm initial={insight} />;
}
