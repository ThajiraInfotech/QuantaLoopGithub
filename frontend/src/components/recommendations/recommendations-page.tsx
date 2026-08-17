"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { MaterialRecommendationCard } from "@/components/recommendations/material-recommendation-card";
import { PriorityBadge } from "@/components/recommendations/priority-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  fetchMaterialRecommendations,
  fetchParticipantRecommendations,
} from "@/services/recommendations/recommendation.service";
import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/store/auth-store";
import { useRecommendationStore } from "@/store/recommendation-store";
import type {
  MaterialRecommendationItem,
  ParticipantRecommendationItem,
  RecommendationSection,
} from "@/types/recommendation";

const POLL_MS = 120_000;

export function RecommendationsPage() {
  const t = useTranslations("dashboard.recommendations");
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isProvider = user?.role === "material_provider";
  const isMvpRole =
    user?.role === "material_provider" || user?.role === "verified_buyer";
  const setMaterialStore = useRecommendationStore((s) => s.setMaterialSections);
  const setParticipantStore = useRecommendationStore(
    (s) => s.setParticipantSections
  );

  const [materialSections, setMaterialSections] = useState<
    RecommendationSection<MaterialRecommendationItem>[]
  >([]);
  const [participantSections, setParticipantSections] = useState<
    RecommendationSection<ParticipantRecommendationItem>[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isMvpRole) {
      router.replace(ROUTES.dashboard);
    }
  }, [isMvpRole, router]);

  const load = useCallback(async () => {
    if (isMvpRole) return;
    try {
      const [materials, participants] = await Promise.all([
        fetchMaterialRecommendations(),
        fetchParticipantRecommendations(),
      ]);
      setMaterialSections(materials);
      setParticipantSections(participants);
      setMaterialStore(materials);
      setParticipantStore(participants);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [isMvpRole, setMaterialStore, setParticipantStore, t]);

  useEffect(() => {
    if (isMvpRole) return;
    void load();
    const id = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(id);
  }, [isMvpRole, load]);

  if (isMvpRole) {
    return (
      <div className="mx-auto max-w-2xl py-8 text-sm text-zinc-600">
        {t("redirecting")}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-8">
        <div className="h-10 w-1/2 animate-pulse rounded-md bg-zinc-100" />
        <div className="h-28 animate-pulse rounded-xl border border-zinc-200/80 bg-zinc-50" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-red-700" role="alert">
        {error}
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          {isProvider ? t("titleMatches") : t("title")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600">
          {isProvider ? t("subtitleProvider") : t("subtitleBuyer")}
        </p>
      </div>

      {materialSections.map((section) => (
        <section key={section.id} className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">{section.title}</h2>
            <p className="mt-1 text-sm text-zinc-600">{section.subtitle}</p>
          </div>
          <ul className="space-y-3">
            {section.items.map((item) => (
              <li key={`${section.id}-${item.materialId}`}>
                <MaterialRecommendationCard item={item} />
              </li>
            ))}
          </ul>
          {section.items.length === 0 ? (
            <p className="text-sm text-zinc-500">{t("emptySection")}</p>
          ) : null}
        </section>
      ))}

      {participantSections.map((section) => (
        <section key={section.id} className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">{section.title}</h2>
            <p className="mt-1 text-sm text-zinc-600">{section.subtitle}</p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {section.items.map((p) => (
              <li key={p.participantId}>
                <Card className="border-zinc-200/80">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{p.companyName}</CardTitle>
                      {isProvider && p.compositeScore != null ? (
                        <span className="shrink-0 rounded-md bg-zinc-900 px-2 py-0.5 text-xs font-semibold text-white">
                          {t("matchScore", { score: p.compositeScore })}
                        </span>
                      ) : (
                        <PriorityBadge priority={p.priority} />
                      )}
                    </div>
                    <CardDescription>{p.headline}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs text-zinc-500">
                    <p>
                      {p.location}
                      {p.industryType ? ` · ${p.industryType}` : ""}
                    </p>
                    {p.responseQualityLabel ? (
                      <p className="text-zinc-600">{p.responseQualityLabel}</p>
                    ) : null}
                    {isProvider ? (
                      <Link
                        href={ROUTES.participantProfile(p.participantId)}
                        className="inline-flex text-xs font-medium text-zinc-900 underline-offset-4 hover:underline"
                      >
                        {t("viewProfile")}
                      </Link>
                    ) : null}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {materialSections.length === 0 && participantSections.length === 0 ? (
        <p className="text-sm text-zinc-500">{t("emptyGlobal")}</p>
      ) : null}
    </div>
  );
}
