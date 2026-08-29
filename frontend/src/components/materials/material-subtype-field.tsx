"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/ui/select-field";
import { materialFieldClass } from "@/components/materials/material-form-styles";
import { isOthersMaterialCategory } from "@/constants/material-categories";
import {
  MATERIAL_SUBTYPE_OTHER,
  getCategoryTaxonomy,
  isValidSubtypeForCategory,
} from "@/constants/material-taxonomy";

type MaterialSubtypeFieldProps = {
  category: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

export function MaterialSubtypeField({
  category,
  value,
  onChange,
  error,
}: MaterialSubtypeFieldProps) {
  const t = useTranslations("materials.form.fields");
  const taxonomy = getCategoryTaxonomy(category);
  const isOthersCategory = isOthersMaterialCategory(category);
  const isKnown = Boolean(
    category && value && isValidSubtypeForCategory(category, value)
  );
  const [useOther, setUseOther] = useState(
    () => Boolean(category && value && !isKnown)
  );

  useEffect(() => {
    if (!category || isOthersCategory) {
      setUseOther(false);
      return;
    }
    if (isValidSubtypeForCategory(category, value)) {
      setUseOther(false);
      return;
    }
    if (value.trim()) {
      setUseOther(true);
    }
  }, [category, value, isOthersCategory]);

  const selectValue = useOther ? MATERIAL_SUBTYPE_OTHER : value;

  if (isOthersCategory) {
    return (
      <div className="space-y-2">
        <Label htmlFor="material-subtype-other">{t("otherMaterialName")}</Label>
        <Input
          id="material-subtype-other"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("otherMaterialPlaceholder")}
          maxLength={120}
          autoComplete="off"
          className={materialFieldClass}
        />
        <p className="text-xs text-zinc-500">{t("otherMaterialHint")}</p>
        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="material-subtype">{t("material")}</Label>
      <SelectField
        id="material-subtype"
        value={selectValue}
        disabled={!category}
        className={materialFieldClass}
        onChange={(e) => {
          const next = e.target.value;
          if (next === MATERIAL_SUBTYPE_OTHER) {
            setUseOther(true);
            if (isKnown) onChange("");
            return;
          }
          setUseOther(false);
          onChange(next);
        }}
      >
        <option value="" disabled>
          {category ? t("selectMaterial") : t("selectCategoryFirst")}
        </option>
        {taxonomy?.sections.map((section) => (
          <optgroup key={section.label} label={section.label}>
            {section.items.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </optgroup>
        ))}
        {category ? (
          <option value={MATERIAL_SUBTYPE_OTHER}>{t("otherMaterial")}</option>
        ) : null}
      </SelectField>
      {useOther && category ? (
        <div className="space-y-1.5">
          <Label htmlFor="material-subtype-other">{t("otherMaterialName")}</Label>
          <Input
            id="material-subtype-other"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={t("otherMaterialPlaceholder")}
            maxLength={120}
            autoComplete="off"
            className={materialFieldClass}
          />
          <p className="text-xs text-zinc-500">{t("otherMaterialHint")}</p>
        </div>
      ) : null}
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
