"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/ui/select-field";
import { materialFieldClass } from "@/components/materials/material-form-styles";
import {
  MATERIAL_UNIT_OPTIONS,
  MATERIAL_UNIT_OTHER,
  isKnownMaterialUnit,
} from "@/constants/material-form";

type MaterialUnitFieldProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

export function MaterialUnitField({
  value,
  onChange,
  error,
}: MaterialUnitFieldProps) {
  const t = useTranslations("materials.form.fields");
  const isKnown = Boolean(value && isKnownMaterialUnit(value));
  const [useOther, setUseOther] = useState(
    () => Boolean(value && !isKnown)
  );

  useEffect(() => {
    if (isKnownMaterialUnit(value)) {
      setUseOther(false);
      return;
    }
    if (value.trim()) {
      setUseOther(true);
    }
  }, [value]);

  const selectValue = useOther ? MATERIAL_UNIT_OTHER : value;

  return (
    <div className="space-y-2">
      <Label htmlFor="unit">{t("unit")}</Label>
      <SelectField
        id="unit"
        value={selectValue}
        className={materialFieldClass}
        onChange={(e) => {
          const next = e.target.value;
          if (next === MATERIAL_UNIT_OTHER) {
            setUseOther(true);
            if (isKnown) onChange("");
            return;
          }
          setUseOther(false);
          onChange(next);
        }}
      >
        <option value="" disabled>
          {t("selectUnit")}
        </option>
        {MATERIAL_UNIT_OPTIONS.map((unit) => (
          <option key={unit} value={unit}>
            {unit}
          </option>
        ))}
        <option value={MATERIAL_UNIT_OTHER}>{t("otherUnit")}</option>
      </SelectField>
      {useOther ? (
        <div className="space-y-1.5">
          <Label htmlFor="unit-other">{t("otherUnitName")}</Label>
          <Input
            id="unit-other"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={t("otherUnitPlaceholder")}
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
