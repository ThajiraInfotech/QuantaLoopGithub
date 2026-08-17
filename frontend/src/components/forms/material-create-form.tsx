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
  resolveSubtypeForCategory,
} from "@/constants/material-taxonomy";
import {
  locationDraftToMaterialLocation,
  userToLocationDraft,
} from "@/lib/location-profile";
import { ROUTES } from "@/constants/routes";
import {
  createMaterial,
  fetchMaterialById,
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

type MaterialCreateFormProps = {
  duplicateFromId?: string;
};

export function MaterialCreateForm({ duplicateFromId }: MaterialCreateFormProps) {
  const t = useTranslations("materials.form");
  const tf = useTranslations("materials.form.fields");
  const ts = useTranslations("materials.form.sidebar");
  const tv = useTranslations("validation.material");
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const materialCount = useMaterialStore((s) => s.items.length);
  const upsert = useMaterialStore((s) => s.upsert);
  const [formError, setFormError] = useState<string | null>(null);
  const [prefillLoading, setPrefillLoading] = useState(Boolean(duplicateFromId));
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
    if (duplicateFromId || !user) return;
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
  }, [duplicateFromId, user, form, isIndianSeller, userCountry]);

  useEffect(() => {
    if (!duplicateFromId) return;
    let cancelled = false;
    (async () => {
      try {
        const m = await fetchMaterialById(duplicateFromId);
        if (cancelled) return;
        form.reset({
          title: m.title,
          materialType: normalizeMaterialCategory(m.materialType),
          materialSubtype: resolveSubtypeForCategory(
            normalizeMaterialCategory(m.materialType),
            m.materialSubtype || m.materialType
          ),
          materialForm: m.materialForm ?? "",
          cleanliness: m.cleanliness ?? "",
          description: m.description ?? "",
          quantity: m.quantity,
          unit: m.unit,
          location: m.location,
          country: normalizeCountryCode(m.country || user?.country),
          marketScope: m.marketScope === "global" ? "global" : "india",
          availabilityFrequency: m.availabilityFrequency,
          pickupAvailable: m.pickupAvailable,
          estimatedValueRange: m.estimatedValueRange ?? "",
          industryType: m.industryType ?? "",
          visibility: m.visibility,
          status: "available",
        });
      } catch (e) {
        if (!cancelled) {
          toast.error(
            e instanceof Error ? e.message : "Could not load material to duplicate"
          );
        }
      } finally {
        if (!cancelled) setPrefillLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [duplicateFromId, form]);

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

  if (prefillLoading) {
    return (
      <div className="py-12 text-sm text-zinc-500">{t("duplicateLoading")}</div>
    );
  }

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start lg:gap-8">
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
        noValidate
      >
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            {duplicateFromId ? t("duplicateTitle") : t("createTitle")}
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-zinc-600">
            {duplicateFromId ? t("duplicateDescription") : t("createDescription")}
          </p>
          {!duplicateFromId ? (
            <p className="text-sm font-medium text-emerald-800">
              ✓ {t("quickNote")}
            </p>
          ) : null}
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm shadow-zinc-950/[0.04] sm:p-8">
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

        <div className="flex flex-wrap items-center gap-3 pb-4">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? t("publishing") : t("publish")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push(ROUTES.materials)}
          >
            {t("cancel")}
          </Button>
        </div>
      </form>

      <aside className="hidden lg:block">
        <Card className="sticky top-8 border-zinc-200/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{ts("title")}</CardTitle>
            <CardDescription>{ts("description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-zinc-700">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                {ts("company")}
              </p>
              <p className="mt-0.5 font-medium text-zinc-900">
                {user?.companyName ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                {ts("profileCategories")}
              </p>
              <p className="mt-0.5">
                {(user?.preferredMaterialCategories?.length
                  ? user.preferredMaterialCategories
                  : user?.materialTypes ?? []
                ).join(", ") || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                {ts("location")}
              </p>
              <p className="mt-0.5">
                {companyMaterialLocation(user) || "—"}
              </p>
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
                {user?.averageResponseTime?.trim()
                  ? user.averageResponseTime
                  : ts("profileCompletion", {
                      percent: user?.profileCompletion ?? 0,
                    })}
              </p>
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
