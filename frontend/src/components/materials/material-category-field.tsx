"use client";

import { useTranslations } from "next-intl";

import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/ui/select-field";
import { MATERIAL_CATEGORY_GROUPS } from "@/constants/material-categories";
import { materialFieldClass } from "@/components/materials/material-form-styles";

type MaterialCategoryFieldProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

export function MaterialCategoryField({
  id = "material-category",
  value,
  onChange,
  error,
}: MaterialCategoryFieldProps) {
  const t = useTranslations("materials.form.fields");
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{t("materialCategory")}</Label>
      <SelectField
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={materialFieldClass}
      >
        <option value="" disabled>
          {t("selectCategory")}
        </option>
        {MATERIAL_CATEGORY_GROUPS.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </SelectField>
      <p className="text-xs text-zinc-500">{t("categoryHint")}</p>
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
