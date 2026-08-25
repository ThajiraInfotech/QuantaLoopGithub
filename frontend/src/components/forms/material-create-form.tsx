"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";

import { MaterialCategoryField } from "@/components/materials/material-category-field";
import { MaterialCleanlinessField } from "@/components/materials/material-cleanliness-field";
import { MaterialFormField } from "@/components/materials/material-form-field";
import { MaterialLocationField } from "@/components/materials/material-location-field";
import { MaterialMarketScopeField } from "@/components/materials/material-market-scope-field";
import { MaterialPhotoField } from "@/components/materials/material-photo-field";
import { MaterialSubtypeField } from "@/components/materials/material-subtype-field";
import { MaterialUnitField } from "@/components/materials/material-unit-field";
import {
  materialFieldClass,
  materialPrimaryButtonClass,
  materialTextareaClass,
} from "@/components/materials/material-form-styles";
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
  countryNameFromCode,
  isIndiaCountry,
  normalizeCountryCode,
} from "@/constants/countries";
import { normalizeMaterialCategory } from "@/constants/material-categories";
import {
  isValidSubtypeForCategory,
} from "@/constants/material-taxonomy";
import {
  locationDraftToMaterialLocation,
  userToLocationDraft,
} from "@/lib/location-profile";
import { ROUTES } from "@/constants/routes";
import {
  createMaterial,
} from "@/services/materials/material.service";
import { useAuthStore } from "@/store/auth-store";
import { useMaterialStore } from "@/store/material-store";
import {
  createMaterialFormSchema,
  type CreateMaterialFormValues,
} from "@/validations/material";
import type { z } from "zod";

type MaterialFormInput = z.input<ReturnType<typeof createMaterialFormSchema>>;

function defaultMaterialCategory(user: {
  preferredMaterialCategories?: string[];
  materialTypes?: string[];
} | null): string {
  if (!user) return "";
  const preferred = user.preferredMaterialCategories ?? user.materialTypes ?? [];
  if (preferred.length === 1) {
    return normalizeMaterialCategory(preferred[0]);
  }
  return "";
}

function companyMaterialLocation(user: Parameters<typeof userToLocationDraft>[0]) {
  return locationDraftToMaterialLocation(userToLocationDraft(user));
}

function generateListingTitle(
  materialSubtype: string,
  materialType: string,
  listingIndex: number
): string {
  const label = materialSubtype.trim() || materialType.trim() || "Material";
  return `${label} – Lot ${listingIndex}`;
}

export function MaterialCreateForm() {
  const t = useTranslations("materials.form");
  const tf = useTranslations("materials.form.fields");
  const tv = useTranslations("validation.material");
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const materialCount = useMaterialStore((s) => s.items.length);
  const upsert = useMaterialStore((s) => s.upsert);
  const [formError, setFormError] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const companyLocation = userToLocationDraft(user);
  const userCountry = normalizeCountryCode(user?.country);
  const isIndianSeller = isIndiaCountry(userCountry);

  const materialSchema = useMemo(
    () =>
      createMaterialFormSchema({
        categoryRequired: tv("categoryRequired"),
        categoryFromList: tv("categoryFromList"),
        materialRequired: tv("materialRequired"),
        quantityRequired: tv("quantityRequired"),
        quantityNonNegative: tv("quantityNonNegative"),
        unitRequired: tv("unitRequired"),
        locationRequired: tv("locationRequired"),
        otherMaterialRequired: tv("otherMaterialRequired"),
        otherUnitRequired: tv("otherUnitRequired"),
        otherFormRequired: tv("otherFormRequired"),
        otherCleanlinessRequired: tv("otherCleanlinessRequired"),
      }),
    [tv]
  );

  const form = useForm<MaterialFormInput>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      title: "",
      materialType: defaultMaterialCategory(user),
      materialSubtype: "",
      materialForm: "",
      cleanliness: "",
      description: "",
      quantity: "",
      unit: "",
      location: companyMaterialLocation(user),
      country: normalizeCountryCode(user?.country),
      marketScope: "india" as const,
      availabilityFrequency: "one_time" as const,
      pickupAvailable: false,
      estimatedValueRange: "",
      industryType: "",
      visibility: "network" as const,
      status: "available" as const,
    },
  });

  useEffect(() => {
    if (!user) return;
    const companyLoc = isIndianSeller
      ? companyMaterialLocation(user)
      : countryNameFromCode(userCountry);
    if (companyLoc && !form.getValues("location")) {
      form.setValue("location", companyLoc);
    }
    if (!isIndianSeller) {
      form.setValue("country", userCountry);
      form.setValue("marketScope", "global");
    }
    const category = defaultMaterialCategory(user);
    if (category && !form.getValues("materialType")) {
      form.setValue("materialType", category);
    }
  }, [user, form, isIndianSeller, userCountry]);

  async function onSubmit(raw: MaterialFormInput) {
    const values = materialSchema.parse(raw) as CreateMaterialFormValues;
    setFormError(null);
    const payload: CreateMaterialFormValues = {
      ...values,
      visibility: values.visibility ?? "network",
      country: isIndianSeller ? "IN" : userCountry,
      marketScope: isIndianSeller
        ? values.marketScope === "global"
          ? "global"
          : "india"
        : "global",
      location: isIndianSeller
        ? values.location
        : countryNameFromCode(userCountry),
      imageUrls,
      title:
        values.title.trim() ||
        generateListingTitle(
          values.materialSubtype,
          values.materialType,
          materialCount + 1
        ),
    };
    try {
      const material = await createMaterial(payload);
      upsert(material);
      toast.success(t("publishSuccess"));
      router.push(ROUTES.materialDetail(material.id));
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("saveError");
      setFormError(msg);
      toast.error(msg);
    }
  }

  const selectedCategory = form.watch("materialType");

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start lg:gap-8">
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
        noValidate
      >
        <div className="space-y-2">
          <h1 className="text-[1.5rem] font-semibold tracking-tight text-balance text-zinc-900 sm:text-3xl">
            {t("createTitle")}
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-pretty text-zinc-600">
            {t("createDescription")}
          </p>
          <p className="text-sm font-medium text-emerald-800">
            ✓ {t("quickNote")}
          </p>
        </div>

        <div className="lg:hidden">
          <ListingContextCard
            companyName={user?.companyName}
            categories={
              user?.preferredMaterialCategories?.length
                ? user.preferredMaterialCategories
                : user?.materialTypes ?? []
            }
            location={companyMaterialLocation(user)}
            responseTime={user?.averageResponseTime}
            profileCompletion={user?.profileCompletion ?? 0}
          />
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm shadow-zinc-950/[0.04] sm:p-8">
          <div className="grid max-w-2xl gap-6">
            <Controller
              name="materialType"
              control={form.control}
              render={({ field }) => (
                <MaterialCategoryField
                  value={field.value}
                  onChange={(next) => {
                    field.onChange(next);
                    const currentSubtype = form.getValues("materialSubtype");
                    if (
                      currentSubtype &&
                      !isValidSubtypeForCategory(next, currentSubtype)
                    ) {
                      form.setValue("materialSubtype", "");
                    }
                  }}
                  error={form.formState.errors.materialType?.message}
                />
              )}
            />

            <Controller
              name="materialSubtype"
              control={form.control}
              render={({ field }) => (
                <MaterialSubtypeField
                  category={selectedCategory}
                  value={field.value}
                  onChange={field.onChange}
                  error={form.formState.errors.materialSubtype?.message}
                />
              )}
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <Controller
                name="materialForm"
                control={form.control}
                render={({ field }) => (
                  <MaterialFormField
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    error={form.formState.errors.materialForm?.message}
                  />
                )}
              />
              <Controller
                name="cleanliness"
                control={form.control}
                render={({ field }) => (
                  <MaterialCleanlinessField
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    error={form.formState.errors.cleanliness?.message}
                  />
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">{tf("title")}</Label>
              <Input
                id="title"
                placeholder={tf("titlePlaceholder")}
                className={materialFieldClass}
                {...form.register("title")}
              />
              <p className="text-xs text-zinc-500">{t("titleOptionalHint")}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{tf("description")}</Label>
              <Textarea
                id="description"
                rows={4}
                placeholder={tf("descriptionPlaceholder")}
                className={materialTextareaClass}
                {...form.register("description")}
              />
            </div>

            <MaterialPhotoField value={imageUrls} onChange={setImageUrls} />

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="quantity">{tf("quantity")}</Label>
                <Input
                  id="quantity"
                  type="number"
                  min={0}
                  step="any"
                  placeholder={tf("quantityPlaceholder")}
                  inputMode="decimal"
                  className={materialFieldClass}
                  {...form.register("quantity")}
                />
                {form.formState.errors.quantity?.message ? (
                  <p className="text-sm text-red-600" role="alert">
                    {form.formState.errors.quantity.message}
                  </p>
                ) : null}
              </div>
              <Controller
                name="unit"
                control={form.control}
                render={({ field }) => (
                  <MaterialUnitField
                    value={field.value}
                    onChange={field.onChange}
                    error={form.formState.errors.unit?.message}
                  />
                )}
              />
            </div>

            <Controller
              name="location"
              control={form.control}
              render={({ field }) =>
                isIndianSeller ? (
                  <MaterialLocationField
                    companyLocation={companyLocation}
                    value={field.value}
                    onChange={field.onChange}
                    error={form.formState.errors.location?.message}
                  />
                ) : (
                  <div className="space-y-2 rounded-xl border border-zinc-200/80 bg-zinc-50/60 p-4">
                    <Label>Listing country</Label>
                    <p className="text-sm font-medium text-zinc-900">
                      {countryNameFromCode(userCountry)}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Abroad listings use country only — no city or state
                      proximity.
                    </p>
                  </div>
                )
              }
            />

            {isIndianSeller ? (
              <Controller
                name="marketScope"
                control={form.control}
                render={({ field }) => (
                  <MaterialMarketScopeField
                    value={field.value === "global" ? "global" : "india"}
                    onChange={field.onChange}
                  />
                )}
              />
            ) : null}
          </div>
        </div>

        {formError ? (
          <p className="text-sm text-red-600" role="alert">
            {formError}
          </p>
        ) : null}

        <div className="sticky bottom-0 z-20 -mx-4 border-t border-zinc-200 bg-white/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:pb-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className={materialPrimaryButtonClass}
            >
              {form.formState.isSubmitting ? t("publishing") : t("publish")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className={materialPrimaryButtonClass}
              onClick={() => router.push(ROUTES.materials)}
            >
              {t("cancel")}
            </Button>
          </div>
        </div>
      </form>

      <aside className="mt-6 hidden lg:mt-0 lg:block">
        <div className="lg:sticky lg:top-8">
          <ListingContextCard
            companyName={user?.companyName}
            categories={
              user?.preferredMaterialCategories?.length
                ? user.preferredMaterialCategories
                : user?.materialTypes ?? []
            }
            location={companyMaterialLocation(user)}
            responseTime={user?.averageResponseTime}
            profileCompletion={user?.profileCompletion ?? 0}
          />
        </div>
      </aside>
    </div>
  );
}

function ListingContextCard({
  companyName,
  categories,
  location,
  responseTime,
  profileCompletion,
}: {
  companyName?: string;
  categories: string[];
  location: string;
  responseTime?: string;
  profileCompletion: number;
}) {
  const ts = useTranslations("materials.form.sidebar");

  return (
    <Card className="border-zinc-200/80">
      <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-3">
        <CardTitle className="text-base">{ts("title")}</CardTitle>
        <CardDescription>{ts("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0 text-sm text-zinc-700 sm:p-6 sm:pt-0">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            {ts("company")}
          </p>
          <p className="mt-0.5 font-medium text-zinc-900">
            {companyName ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            {ts("profileCategories")}
          </p>
          <p className="mt-0.5">{categories.join(", ") || "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            {ts("location")}
          </p>
          <p className="mt-0.5">{location || "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            {ts("listingVisibility")}
          </p>
          <p className="mt-0.5">{ts("networkVisibility")}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            {ts("responseTime")}
          </p>
          <p className="mt-0.5">
            {responseTime?.trim()
              ? responseTime
              : ts("profileCompletion", { percent: profileCompletion })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
