"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/ui/select-field";
import { materialFieldClass } from "@/components/materials/material-form-styles";
import {
  MATERIAL_CLEANLINESS_OPTIONS,
  MATERIAL_CLEANLINESS_OTHER,
  isKnownMaterialCleanliness,
} from "@/constants/material-attributes";

type MaterialCleanlinessFieldProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

export function MaterialCleanlinessField({
  value,
  onChange,
  error,
}: MaterialCleanlinessFieldProps) {
  const t = useTranslations("materials.form.fields");
  const isKnown = Boolean(value && isKnownMaterialCleanliness(value));
  const [useOther, setUseOther] = useState(
    () => Boolean(value && !isKnown)
  );

  useEffect(() => {
    if (isKnownMaterialCleanliness(value)) {
      setUseOther(false);
      return;
    }
    if (value.trim()) {
      setUseOther(true);
    }
  }, [value]);

  const selectValue = useOther ? MATERIAL_CLEANLINESS_OTHER : value;

  return (
    <div className="space-y-2">
      <Label htmlFor="material-cleanliness">{t("cleanliness")}</Label>
      <SelectField
        id="material-cleanliness"
        value={selectValue}
        className={materialFieldClass}
        onChange={(e) => {
          const next = e.target.value;
          if (next === MATERIAL_CLEANLINESS_OTHER) {
            setUseOther(true);
            if (isKnown) onChange("");
            return;
          }
          setUseOther(false);
          onChange(next);
        }}
      >
        <option value="">{t("selectCleanliness")}</option>
        {MATERIAL_CLEANLINESS_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
        <option value={MATERIAL_CLEANLINESS_OTHER}>{t("otherCleanliness")}</option>
      </SelectField>
      {useOther ? (
        <div className="space-y-1.5">
          <Label htmlFor="material-cleanliness-other">
            {t("otherCleanlinessName")}
          </Label>
          <Input
            id="material-cleanliness-other"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={t("otherCleanlinessPlaceholder")}
            maxLength={60}
            autoComplete="off"
            className={materialFieldClass}
          />
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
