import { getTranslations } from "next-intl/server";

export async function LoginFlowVisual() {
  const t = await getTranslations("auth.loginFlow");

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {t("eyebrow")}
      </p>
      <div className="flex flex-col gap-3">
        <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-sm font-semibold text-zinc-900">{t("seller")}</p>
        </div>
        <div className="flex items-center justify-center">
          <div className="h-6 w-px bg-gradient-to-b from-[#33B573] to-transparent" />
        </div>
        <div className="rounded-lg border-2 border-[#33B573]/30 bg-[#F7FCF9] px-4 py-3">
          <p className="text-sm font-semibold text-[#1a7a4a]">{t("matching")}</p>
          <p className="mt-0.5 text-xs text-zinc-500">{t("matchingNote")}</p>
        </div>
        <div className="flex items-center justify-center">
          <div className="h-6 w-px bg-gradient-to-b from-[#33B573] to-transparent" />
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-sm font-semibold text-zinc-900">{t("buyer")}</p>
        </div>
      </div>
      <p className="text-center text-xs text-zinc-500">{t("footer")}</p>
    </div>
  );
}
