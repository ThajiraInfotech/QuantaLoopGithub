"use client";

import { CheckCircle2, Globe2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SubscriptionCheckout } from "@/components/subscriptions/subscription-checkout";
import { useAccessPlanStore } from "@/store/access-plan-store";

export function NetworkAccessPage() {
  const t = useTranslations("dashboard.access");
  const plans = useAccessPlanStore((s) => s.plans);
  const load = useAccessPlanStore((s) => s.load);
  const loading = useAccessPlanStore((s) => s.loading);
  const error = useAccessPlanStore((s) => s.error);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !plans) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-4">
        <div className="h-8 w-1/3 animate-pulse rounded-md bg-zinc-100" />
        <div className="h-40 animate-pulse rounded-xl border border-zinc-200/80 bg-zinc-50" />
      </div>
    );
  }

  if (error && !plans) {
    return (
      <div className="mx-auto max-w-2xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {error}
      </div>
    );
  }

  const anchor = plans?.anchor;

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          {t("title")}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
          {anchor?.headline ?? t("headlineFallback")}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600">
          {anchor?.subtext ?? t("subtextFallback")}
        </p>
      </div>

      {anchor ? (
        <Card className="border-zinc-200/80 bg-white">
          <CardHeader>
            <CardTitle className="text-base">{t("positioningTitle")}</CardTitle>
            <CardDescription>{t("positioningDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-zinc-700">
            <div className="flex flex-wrap items-baseline gap-3 border-b border-zinc-100 pb-4">
              <span className="text-3xl font-semibold tabular-nums text-zinc-900">
                ₹{anchor.annualInr.toLocaleString("en-IN")}
              </span>
              <span className="text-zinc-500">{t("perYear")}</span>
              <span className="text-sm text-zinc-600">
                {t("perDay", { amount: anchor.dailyInrApprox })}
              </span>
            </div>
            <p className="leading-relaxed text-zinc-700">{anchor.rationale}</p>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
              <div className="flex items-start gap-3">
                <Globe2
                  className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700"
                  aria-hidden
                />
                <div>
                  <p className="font-semibold text-emerald-950">
                    {t("globalAccessTitle")}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-emerald-900/80">
                    {t("globalAccessDesc")}
                  </p>
                </div>
              </div>
              <ul className="mt-4 grid gap-2 text-sm text-emerald-950 sm:grid-cols-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700"
                    aria-hidden
                  />
                  <span>{t("globalAccessBuyer")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700"
                    aria-hidden
                  />
                  <span>{t("globalAccessSeller")}</span>
                </li>
              </ul>
            </div>
            <p className="text-xs leading-relaxed text-zinc-500">
              {t("footerNote")}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <SubscriptionCheckout />

      <div className="grid gap-4 md:grid-cols-3">
        {plans?.tiers.map((tier) => (
          <Card key={tier.id} className="border-zinc-200/80 bg-white">
            <CardHeader>
              <CardTitle className="text-base">{tier.name}</CardTitle>
              <CardDescription>{tier.highlight}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-zinc-600">
                {tier.positioning}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
