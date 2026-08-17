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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/ui/select-field";
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
  const tStatus = useTranslations("materials.status");
  const tAvail = useTranslations("materials.availability");
  const td = useTranslations("materials.detail");
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
        ...values,
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
      className="space-y-8"
      noValidate
    >
      <div className="rounded-xl border border-zinc-200/80 bg-white p-6 shadow-sm shadow-zinc-950/5 sm:p-8">
        <div className="max-w-2xl space-y-2">
          <h2 className="text-lg font-semibold text-zinc-900">{t("editTitle")}</h2>
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
            <Input id="title" {...form.register("title")} />
            {form.formState.errors.title?.message ? (
              <p className="text-sm text-red-600" role="alert">
                {form.formState.errors.title.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{tf("description")}</Label>
            <Textarea id="description" {...form.register("description")} />
          </div>

          <MaterialPhotoField value={imageUrls} onChange={setImageUrls} />

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quantity">{tf("quantity")}</Label>
              <Input
                id="quantity"
                type="number"
                min={0}
                step="any"
                {...form.register("quantity", { valueAsNumber: true })}
              />
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

          <div className="space-y-2">
            <Label htmlFor="location">{tf("location")}</Label>
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
                  <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/60 p-4">
                    <p className="text-sm font-medium text-zinc-900">
                      {countryNameFromCode(userCountry)}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Abroad listings use country only — no city or state
                      proximity.
                    </p>
                  </div>
                )
              }
            />
          </div>

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

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="availabilityFrequency">{tf("availabilityRhythm")}</Label>
              <SelectField
                id="availabilityFrequency"
                {...form.register("availabilityFrequency")}
              >
                <option value="one_time">{tf("oneTimeAvailability")}</option>
                <option value="daily">{tAvail("daily")}</option>
                <option value="weekly">{tAvail("weekly")}</option>
                <option value="monthly">{tAvail("monthly")}</option>
              </SelectField>
            </div>
            <div className="space-y-2">
              <Label htmlFor="visibility">{tf("visibility")}</Label>
              <SelectField id="visibility" {...form.register("visibility")}>
                <option value="network">{td("visibilityNetwork")}</option>
                <option value="restricted">{tf("visibilityRestricted")}</option>
              </SelectField>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">{tf("status")}</Label>
            <SelectField id="status" {...form.register("status")}>
              <option value="available">{tStatus("available")}</option>
              <option value="in_discussion">{tStatus("inDiscussion")}</option>
              <option value="fulfilled">{tf("statusFulfilled")}</option>
              <option value="archived">{tStatus("archived")}</option>
            </SelectField>
          </div>

          <div className="space-y-2">
            <Label htmlFor="industryType">{tf("industryContext")}</Label>
            <Input id="industryType" {...form.register("industryType")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimatedValueRange">{tf("valueRange")}</Label>
            <Input
              id="estimatedValueRange"
              {...form.register("estimatedValueRange")}
            />
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-zinc-200/80 bg-zinc-50/80 px-4 py-3">
            <input
              id="pickupAvailable"
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-zinc-300"
              {...form.register("pickupAvailable")}
            />
            <Label htmlFor="pickupAvailable" className="cursor-pointer">
              {tf("pickupOnSite")}
            </Label>
          </div>
        </div>
      </div>

      {formError ? (
        <p className="text-sm text-red-600" role="alert">
          {formError}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? t("saving") : t("saveChanges")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push(ROUTES.materialDetail(materialId))}
        >
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}
