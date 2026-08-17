"use client";

import { useTranslations } from "next-intl";

import { useLocalizedTime } from "@/hooks/use-localized-time";
import type { ProviderMatchBuyer } from "@/services/matches/match.service";

function formatMemberSince(iso: string | undefined, locale?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(locale, { month: "long", year: "numeric" });
}

function formatInterestLabel(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return raw;
  return trimmed
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

type MatchBuyerTrustProps = {
  buyer: ProviderMatchBuyer;
  compact?: boolean;
};

export function MatchBuyerTrust({ buyer, compact = false }: MatchBuyerTrustProps) {
  const t = useTranslations("dashboard.participants.trust");
  const { formatRelativeTime } = useLocalizedTime();
  const memberSince = formatMemberSince(buyer.memberSince);
  const interests = (buyer.materialInterests ?? []).slice(0, 4);

  let activityLine: string | null = null;
  const window = buyer.averageResponseTime?.trim();
  if (window) {
    const lower = window.toLowerCase();
    if (lower.includes("24") || lower.includes("same day")) {
      activityLine = t("responds24h");
    } else if (lower.includes("48")) {
      activityLine = t("responds48h");
    } else {
      activityLine = t("responseWindow", { window });
    }
  } else if (buyer.responseRate != null && buyer.responseRate >= 70) {
    activityLine = t("responseRate", { rate: buyer.responseRate });
  } else if (buyer.lastActiveAt) {
    const rel = formatRelativeTime(buyer.lastActiveAt);
    activityLine = rel ? t("lastActive", { time: rel }) : null;
  }

  return (
    <div className={compact ? "mt-1.5 space-y-1.5 text-xs text-zinc-600" : "mt-2 space-y-1.5 text-xs text-zinc-600"}>
      <p className="leading-snug">
        <span className="font-medium text-zinc-700">{t("registeredBuyer")}</span>
        {memberSince ? (
          <>
            <span className="text-zinc-400"> · </span>
            <span>{t("memberSince", { date: memberSince })}</span>
          </>
        ) : null}
      </p>

      {interests.length > 0 ? (
        <div>
          <p className="font-medium text-zinc-500">{t("interestedIn")}</p>
          <ul className="mt-0.5 list-inside list-disc text-zinc-700">
            {interests.map((item) => (
              <li key={item} className="leading-snug">
                {formatInterestLabel(item)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {activityLine ? (
        <p className="font-medium text-zinc-700">{activityLine}</p>
      ) : null}
    </div>
  );
}
