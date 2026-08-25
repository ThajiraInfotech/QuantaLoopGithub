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
  userToLocationDraft,
} from "@/lib/location-profile";
import { ROUTES } from "@/constants/routes";
import {
  fetchMaterialById,
  updateMaterial,
} from "@/services/materials/material.service";
import { useMaterialStore } from "@/store/material-store";
import { useAuthStore } from "@/store/auth-store";
import {
  createMaterialFormSchema,
  type CreateMaterialFormValues,
} from "@/validations/material";

type MaterialEditFormProps = {
  materialId: string;
};

export function MaterialEditForm({ materialId }: MaterialEditFormProps) {
  const t = useTranslations("materials.form");
  const tf = useTranslations("materials.form.fields");
  const tv = useTranslations("validation.material");
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const companyLocation = userToLocationDraft(user);
  const userCountry = normalizeCountryCode(user?.country);
  const isIndianSeller = isIndiaCountry(userCountry);
  const upsert = useMaterialStore((s) => s.upsert);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

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

  const form = useForm({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      title: "",
      materialType: "",
      materialSubtype: "",
      materialForm: "",
      cleanliness: "",
      description: "",
      quantity: 0,
      unit: "",
      location: "",
      country: "IN",
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
    let cancelled = false;
    (async () => {
      try {
        const m = await fetchMaterialById(materialId);
        if (cancelled) return;
        const category = normalizeMaterialCategory(m.materialType);
        form.reset({
          title: m.title,
          materialType: category,
          materialSubtype: resolveSubtypeForCategory(
            category,
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
          status: m.status,
        });
        setImageUrls(m.imageUrls ?? []);
      } catch (e) {
        if (!cancelled) {
          setFormError(
            e instanceof Error ? e.message : t("loadError")
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [materialId, form]);

  async function onSubmit(values: CreateMaterialFormValues) {
    setFormError(null);
    try {
      const material = await updateMaterial(materialId, {
        title: values.title,
        materialType: values.materialType,
        materialSubtype: values.materialSubtype,
        materialForm: values.materialForm,
        cleanliness: values.cleanliness,
        description: values.description,
        quantity: values.quantity,
        unit: values.unit,
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
      });
      upsert(material);
      toast.success(t("updated"));
      router.push(ROUTES.materialDetail(material.id));
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unable to save";
      setFormError(msg);
      toast.error(msg);
    }
  }

  const selectedCategory = form.watch("materialType");

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl py-12 text-sm text-zinc-500">
        {t("loading")}
      </div>
    );
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-6 sm:space-y-8"
      noValidate
    >
      <div className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm shadow-zinc-950/5 sm:p-8">
        <div className="max-w-2xl space-y-2">
          <h2 className="text-[1.5rem] font-semibold tracking-tight text-pretty text-zinc-900 sm:text-2xl">
            {t("editTitle")}
          </h2>
          <p className="text-sm leading-relaxed text-zinc-600">
            {t("editDescription")}
          </p>
        </div>

        <div className="mt-8 grid max-w-2xl gap-6">
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

          <div className="grid gap-6 sm:grid-cols-2">
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

      <div className="sticky bottom-0 z-20 -mx-4 border-t border-zinc-200 bg-white/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className={materialPrimaryButtonClass}
          >
            {form.formState.isSubmitting ? t("saving") : t("saveChanges")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className={materialPrimaryButtonClass}
            onClick={() => router.push(ROUTES.materialDetail(materialId))}
          >
            {t("cancel")}
          </Button>
        </div>
      </div>
    </form>
  );
}
