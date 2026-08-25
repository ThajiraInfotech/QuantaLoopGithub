"use client";

import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/ui/select-field";
import {
  COUNTRY_OPTIONS,
  INDIA_COUNTRY_CODE,
  normalizeCountryCode,
} from "@/constants/countries";
import { cn } from "@/lib/utils";

type CountrySelectFieldProps = {
  value: string;
  onChange: (countryCode: string) => void;
  label?: string;
  hint?: string;
  excludeIndia?: boolean;
  className?: string;
  id?: string;
};

export function CountrySelectField({
  value,
  onChange,
  label = "Country",
  hint,
  excludeIndia = false,
  className,
  id = "country-select",
}: CountrySelectFieldProps) {
  const options = excludeIndia
    ? COUNTRY_OPTIONS.filter((c) => c.code !== INDIA_COUNTRY_CODE)
    : COUNTRY_OPTIONS;

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      {hint ? <p className="text-xs leading-relaxed text-zinc-500">{hint}</p> : null}
      <SelectField
        id={id}
        value={normalizeCountryCode(value)}
        onChange={(e) => onChange(normalizeCountryCode(e.target.value))}
        className="h-12 border-zinc-200 bg-white text-base sm:h-10 sm:text-small"
      >
        {options.map((country) => (
          <option key={country.code} value={country.code}>
            {country.name}
          </option>
        ))}
      </SelectField>
    </div>
  );
}
