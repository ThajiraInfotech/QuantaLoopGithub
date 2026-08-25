"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";

import { CountrySelectField } from "@/components/onboarding/country-select-field";
import {
  GeographySelection,
  isLocationDraftComplete,
} from "@/components/onboarding/geography-selection";
import { MaterialsSelection } from "@/components/onboarding/materials-selection";
import { ProfilePaymentsSection } from "@/components/profile/profile-payments-section";
import { RoleBadge } from "@/components/trust/role-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  INDIA_COUNTRY_CODE,
  isIndiaCountry,
  normalizeCountryCode,
} from "@/constants/countries";
import {
  emptyLocationDraft,
  getLocationDraftError,
  locationDraftToPatch,
  userToLocationDraft,
  type LocationDraft,
} from "@/lib/location-profile";
import { patchMyProfile } from "@/services/profile/profile.service";
import { useAuthStore } from "@/store/auth-store";
import { useProfileTrustStore } from "@/store/profile-trust-store";
import type { User } from "@/types/user";
import {
  companyFormToPatch,
  companyProfileFormSchema,
  type CompanyProfileFormValues,
  type ProfilePatchInput,
} from "@/validations/profile";

const fieldClass =
  "h-12 border-zinc-200 bg-white text-base sm:h-10 sm:text-small";

function matchingCategoriesFromUser(user: User): string[] {
  if (user.role === "verified_buyer") {
    const required = user.requiredMaterialCategories ?? [];
    if (required.length) return required;
  }
  if (user.role === "material_provider") {
    const preferred = user.preferredMaterialCategories ?? [];
    if (preferred.length) return preferred;
  }
  return user.materialTypes ?? [];
}

function matchingPatch(
  user: User,
  materials: string[],
  location: LocationDraft
): ProfilePatchInput {
  const categories = materials.map((item) => item.trim()).filter(Boolean).slice(0, 40);
  const patch: ProfilePatchInput = {
    ...locationDraftToPatch(location),
    materialTypes: categories,
  };
  if (user.role === "verified_buyer") {
    patch.requiredMaterialCategories = categories;
  } else if (user.role === "material_provider") {
    patch.preferredMaterialCategories = categories;
  }
  return patch;
}

function buildDefaults(user: User): CompanyProfileFormValues {
  return {
    name: user.name,
    companyName: user.companyName,
    companyDescription: user.companyDescription ?? "",
    website: user.website ?? "",
    industriesText: (user.industriesHandled ?? []).join(", "),
    industryType: user.industryType ?? "",
    employeeRange: user.employeeRange ?? "",
    establishedYear:
      user.establishedYear != null ? String(user.establishedYear) : "",
    responseRate: user.responseRate ?? 0,
    averageResponseTime: user.averageResponseTime ?? "",
  };
}

export function CompanyProfilePage() {
  const t = useTranslations("profile.company");
  const tf = useTranslations("profile.company.fields");
  const tMaterials = useTranslations("onboarding.materials");
  const user = useAuthStore((s) => s.user);
  const syncUser = useAuthStore((s) => s.syncUser);
  const trustSignals = useProfileTrustStore((s) => s.trustSignals);
  const refreshTrust = useProfileTrustStore((s) => s.refresh);
  const profileLoadError = useProfileTrustStore((s) => s.error);
  const [saveStatus, setSaveStatus] = useState<"success" | "error" | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [materials, setMaterials] = useState<string[]>(() =>
    user ? matchingCategoriesFromUser(user) : []
  );
  const [locationDraft, setLocationDraft] = useState<LocationDraft>(() =>
    userToLocationDraft(user)
  );

  const form = useForm<CompanyProfileFormValues>({
    resolver: zodResolver(
      companyProfileFormSchema
    ) as Resolver<CompanyProfileFormValues>,
    defaultValues: user ? buildDefaults(user) : undefined,
  });

  const resetFromUser = useCallback(
    (next: User) => {
      form.reset(buildDefaults(next));
      setMaterials(matchingCategoriesFromUser(next));
      setLocationDraft(userToLocationDraft(next));
    },
    [form]
  );

  useEffect(() => {
    void refreshTrust();
  }, [refreshTrust]);

  useEffect(() => {
    if (user) resetFromUser(user);
  }, [user, resetFromUser]);

  if (!user) {
    return null;
  }

  const isBuyer = user.role === "verified_buyer";
  const indiaSelected = isIndiaCountry(locationDraft.country);

  function handleCountryChange(countryCode: string) {
    const country = normalizeCountryCode(countryCode);
    if (isIndiaCountry(country)) {
      setLocationDraft({
        ...emptyLocationDraft(),
        country: INDIA_COUNTRY_CODE,
        stateCode: locationDraft.stateCode,
        state: locationDraft.state,
        city: locationDraft.city,
      });
      return;
    }
    setLocationDraft({
      ...emptyLocationDraft(),
      country,
    });
  }

  async function onSubmit(values: CompanyProfileFormValues) {
    if (!user) return;

    setSaveStatus(null);
    setSaveError(null);

    if (materials.length === 0) {
      setSaveStatus("error");
      setSaveError(tMaterials("minOneCategory"));
      return;
    }
    if (!isLocationDraftComplete(locationDraft)) {
      setSaveStatus("error");
      setSaveError(getLocationDraftError(locationDraft) ?? t("saveError"));
      return;
    }

    try {
      const body = {
        ...companyFormToPatch(values),
        ...matchingPatch(user, materials, locationDraft),
      };
      const { profile, trustSignals: nextSignals } = await patchMyProfile(
        body
      );
      syncUser(profile);
      useProfileTrustStore.getState().setTrustSignals(nextSignals);
      resetFromUser(profile);
      setSaveStatus("success");
    } catch (e) {
      setSaveStatus("error");
      setSaveError(e instanceof Error ? e.message : t("saveError"));
    }
  }

  const completion = user.profileCompletion ?? 0;

  return (
    <div className="mx-auto max-w-4xl space-y-5 sm:space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[1.5rem] font-semibold tracking-tight text-balance text-zinc-900 sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-pretty text-zinc-600">
            {t("subtitle")}
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <RoleBadge role={user.role} />
          <div className="sm:text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              {t("profileStrength")}
            </p>
            <p className="text-lg font-semibold tabular-nums text-zinc-900">
              {completion}%
            </p>
          </div>
        </div>
      </div>

      {profileLoadError ? (
        <p className="text-sm leading-relaxed text-pretty text-amber-800">
          {profileLoadError}
        </p>
      ) : null}

      {trustSignals && trustSignals.labels.length > 0 ? (
        <Card className="border-zinc-200/80">
          <CardHeader className="p-4 sm:p-6 sm:pb-0">
            <CardTitle className="text-base">{t("networkSignals.title")}</CardTitle>
            <CardDescription>{t("networkSignals.description")}</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <ul className="space-y-2 text-sm text-zinc-800">
              {trustSignals.labels.map((label) => (
                <li
                  key={label}
                  className="rounded-md border border-zinc-100 bg-zinc-50/80 px-3 py-2 text-pretty"
                >
                  {label}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-5 sm:space-y-8"
        noValidate
      >
        <Card className="border-zinc-200/80">
          <CardHeader className="p-4 sm:p-6 sm:pb-0">
            <CardTitle className="text-base">{t("overview.title")}</CardTitle>
            <CardDescription>{t("overview.description")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="companyName">{tf("companyName")}</Label>
              <Input
                id="companyName"
                className={fieldClass}
                {...form.register("companyName")}
              />
              {form.formState.errors.companyName?.message ? (
                <p className="text-sm text-red-600" role="alert">
                  {form.formState.errors.companyName.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="companyDescription">{tf("companyDescription")}</Label>
              <Textarea
                id="companyDescription"
                rows={5}
                className="resize-y border-zinc-200 text-base sm:text-small"
                {...form.register("companyDescription")}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="website">{tf("website")}</Label>
              <Input
                id="website"
                type="url"
                inputMode="url"
                placeholder={tf("websitePlaceholder")}
                className={fieldClass}
                {...form.register("website")}
              />
              {form.formState.errors.website?.message ? (
                <p className="text-sm text-red-600" role="alert">
                  {form.formState.errors.website.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">{tf("contactName")}</Label>
              <Input
                id="name"
                className={fieldClass}
                {...form.register("name")}
              />
              {form.formState.errors.name?.message ? (
                <p className="text-sm text-red-600" role="alert">
                  {form.formState.errors.name.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="employeeRange">{tf("employeeRange")}</Label>
              <Input
                id="employeeRange"
                placeholder={tf("employeePlaceholder")}
                className={fieldClass}
                {...form.register("employeeRange")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="establishedYear">{tf("establishedYear")}</Label>
              <Input
                id="establishedYear"
                inputMode="numeric"
                className={fieldClass}
                {...form.register("establishedYear")}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200/80">
          <CardHeader className="p-4 sm:p-6 sm:pb-0">
            <CardTitle className="text-base">{t("operational.title")}</CardTitle>
            <CardDescription>{t("operational.description")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 p-4 sm:p-6">
            <div className="space-y-2">
              <Label htmlFor="industryType">{tf("industryType")}</Label>
              <Input
                id="industryType"
                className={fieldClass}
                {...form.register("industryType")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industriesText">{tf("industriesText")}</Label>
              <Textarea
                id="industriesText"
                rows={3}
                className="resize-y border-zinc-200 text-base sm:text-small"
                {...form.register("industriesText")}
              />
            </div>

            <MaterialsSelection
              embedded
              selected={materials}
              onChange={setMaterials}
              label={
                isBuyer
                  ? tMaterials("buyerTitle")
                  : tMaterials("providerTitle")
              }
              description={
                isBuyer
                  ? tMaterials("buyerDescription")
                  : tMaterials("providerDescription")
              }
            />

            <div className="space-y-4 border-t border-zinc-100 pt-5">
              <div>
                <p className="text-small font-medium text-foreground">
                  {tf("operatingLocation")}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-pretty text-zinc-500">
                  {tf("operatingLocationHint")}
                </p>
              </div>
              <CountrySelectField
                value={locationDraft.country || INDIA_COUNTRY_CODE}
                onChange={handleCountryChange}
                label={tf("country")}
                hint={tf("countryHint")}
              />
              {indiaSelected ? (
                <GeographySelection
                  value={locationDraft}
                  onChange={setLocationDraft}
                />
              ) : (
                <p className="rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 text-sm leading-relaxed text-pretty text-zinc-600">
                  {tf("abroadLocationNote")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200/80">
          <CardHeader className="p-4 sm:p-6 sm:pb-0">
            <CardTitle className="text-base">{t("response.title")}</CardTitle>
            <CardDescription>{t("response.description")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
            <div className="space-y-2">
              <Label htmlFor="responseRate">{tf("responseRate")}</Label>
              <Input
                id="responseRate"
                type="number"
                inputMode="numeric"
                min={0}
                max={100}
                className={fieldClass}
                {...form.register("responseRate", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="averageResponseTime">{tf("responseWindow")}</Label>
              <Input
                id="averageResponseTime"
                placeholder={tf("responseWindowPlaceholder")}
                className={fieldClass}
                {...form.register("averageResponseTime")}
              />
            </div>
          </CardContent>
        </Card>

        {saveStatus ? (
          <p
            className={
              saveStatus === "success"
                ? "text-sm leading-relaxed text-pretty text-zinc-700"
                : "text-sm leading-relaxed text-pretty text-red-600"
            }
            role="status"
          >
            {saveStatus === "success" ? t("saved") : saveError ?? t("saveError")}
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="h-12 w-full sm:h-10 sm:w-auto"
        >
          {form.formState.isSubmitting ? t("saving") : t("saveProfile")}
        </Button>
      </form>

      <ProfilePaymentsSection />
    </div>
  );
}
