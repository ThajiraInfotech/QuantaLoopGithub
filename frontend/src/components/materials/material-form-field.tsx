"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/ui/select-field";
import {
  MATERIAL_FORM_OPTIONS,
  MATERIAL_FORM_OTHER,
  isKnownMaterialForm,
} from "@/constants/material-attributes";

type MaterialFormFieldProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

export function MaterialFormField({
  value,
  onChange,
  error,
}: MaterialFormFieldProps) {
  const t = useTranslations("materials.form.fields");
  const isKnown = Boolean(value && isKnownMaterialForm(value));
  const [useOther, setUseOther] = useState(
    () => Boolean(value && !isKnown)
  );

  useEffect(() => {
    if (isKnownMaterialForm(value)) {
      setUseOther(false);
      return;
    }
    if (value.trim()) {
      setUseOther(true);
    }
  }, [value]);

  const selectValue = useOther ? MATERIAL_FORM_OTHER : value;

  return (
    <div className="space-y-2">
      <Label htmlFor="material-form">{t("materialForm")}</Label>
      <SelectField
        id="material-form"
        value={selectValue}
        onChange={(e) => {
          const next = e.target.value;
          if (next === MATERIAL_FORM_OTHER) {
            setUseOther(true);
            if (isKnown) onChange("");
            return;
          }
          setUseOther(false);
          onChange(next);
        }}
      >
        <option value="">{t("selectForm")}</option>
        {MATERIAL_FORM_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
        <option value={MATERIAL_FORM_OTHER}>{t("otherForm")}</option>
      </SelectField>
      {useOther ? (
        <div className="space-y-1.5">
          <Label htmlFor="material-form-other">{t("otherFormName")}</Label>
          <Input
            id="material-form-other"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={t("otherFormPlaceholder")}
            maxLength={60}
            autoComplete="off"
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
