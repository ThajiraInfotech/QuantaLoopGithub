"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { CountrySelectField } from "@/components/onboarding/country-select-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  INDIAN_LOCATIONS_SORTED,
  getStateByCode,
} from "@/constants/indian-locations";
import { INDIA_COUNTRY_CODE } from "@/constants/countries";
import type { BillingProfile, TaxPreview } from "@/types/billing";

export type BillingFormValues = {
  legalName: string;
  customerType: "individual" | "business";
  gstRegistered: boolean;
  gstin: string;
  taxId: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  country: string;
};

type MembershipBillingFormProps = {
  initialProfile: BillingProfile | null;
  defaults: {
    legalName: string;
    email: string;
    country: string;
    stateCode: string;
    state: string;
    city: string;
  };
  taxPreview: TaxPreview | null;
  disabled?: boolean;
  error?: string | null;
  onChange: (values: BillingFormValues) => void;
  /** Fired when country / state / GST registration changes (for tax preview). */
  onTaxRelevantChange?: (values: BillingFormValues) => void;
};

function formatMoney(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function emptyBillingForm(
  defaults: MembershipBillingFormProps["defaults"]
): BillingFormValues {
  const country = (defaults.country || INDIA_COUNTRY_CODE).toUpperCase();
  return {
    legalName: defaults.legalName || "",
    customerType: "business",
    gstRegistered: false,
    gstin: "",
    taxId: "",
    line1: "",
    line2: "",
    city: defaults.city || "",
    state: defaults.state || "",
    stateCode: defaults.stateCode || "",
    pincode: "",
    country,
  };
}

export function profileToForm(profile: BillingProfile): BillingFormValues {
  return {
    legalName: profile.legalName,
    customerType: profile.customerType,
    gstRegistered: profile.gstRegistered,
    gstin: profile.gstin,
    taxId: profile.taxId,
    line1: profile.address.line1,
    line2: profile.address.line2,
    city: profile.address.city,
    state: profile.address.state,
    stateCode: profile.address.stateCode,
    pincode: profile.address.pincode,
    country: profile.address.country || INDIA_COUNTRY_CODE,
  };
}

export function MembershipBillingForm({
  initialProfile,
  defaults,
  taxPreview,
  disabled,
  error,
  onChange,
  onTaxRelevantChange,
}: MembershipBillingFormProps) {
  const t = useTranslations("onboarding.membership.billing");
  const [values, setValues] = useState<BillingFormValues>(() =>
    initialProfile ? profileToForm(initialProfile) : emptyBillingForm(defaults)
  );

  useEffect(() => {
    if (initialProfile) {
      setValues(profileToForm(initialProfile));
    }
  }, [initialProfile]);

  useEffect(() => {
    onChange(values);
  }, [onChange, values]);

  const isIndia = values.country === INDIA_COUNTRY_CODE;

  const breakdownRows = useMemo(() => {
    if (!taxPreview) return [];
    if (taxPreview.isExport) {
      return [
        { label: t("serviceValue"), value: formatMoney(taxPreview.amountInclusive) },
        { label: t("gst"), value: formatMoney(0) },
      ];
    }
    if (taxPreview.taxType === "cgst_sgst") {
      return [
        { label: t("taxable"), value: formatMoney(taxPreview.taxableAmount) },
        { label: t("cgst"), value: formatMoney(taxPreview.cgstAmount) },
        { label: t("sgst"), value: formatMoney(taxPreview.sgstAmount) },
      ];
    }
    return [
      { label: t("taxable"), value: formatMoney(taxPreview.taxableAmount) },
      { label: t("igst"), value: formatMoney(taxPreview.igstAmount) },
    ];
  }, [t, taxPreview]);

  function patch(
    partial: Partial<BillingFormValues>,
    options?: { taxRelevant?: boolean }
  ) {
    setValues((prev) => {
      const next = { ...prev, ...partial };
      if (options?.taxRelevant) {
        queueMicrotask(() => onTaxRelevantChange?.(next));
      }
      return next;
    });
  }

  function handleCountryChange(country: string) {
    const next = country.toUpperCase();
    if (next === INDIA_COUNTRY_CODE) {
      patch(
        {
          country: next,
          taxId: "",
          stateCode: defaults.stateCode || values.stateCode,
          state: defaults.state || values.state,
        },
        { taxRelevant: true }
      );
      return;
    }
    patch(
      {
        country: next,
        stateCode: "",
        state: "",
        gstRegistered: false,
        gstin: "",
      },
      { taxRelevant: true }
    );
  }

  function handleStateChange(stateCode: string) {
    const state = getStateByCode(stateCode);
    patch(
      {
        stateCode,
        state: state?.name ?? "",
      },
      { taxRelevant: true }
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 sm:p-5">
      <div>
        <h2 className="text-sm font-semibold text-zinc-900">{t("title")}</h2>
        <p className="mt-1 text-xs leading-relaxed text-pretty text-zinc-500">
          {t("description")}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="billing-legal-name">{t("legalName")}</Label>
          <Input
            id="billing-legal-name"
            value={values.legalName}
            disabled={disabled}
            onChange={(e) => patch({ legalName: e.target.value })}
            className="h-11 border-zinc-200 bg-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="billing-customer-type">{t("customerType")}</Label>
          <Select
            id="billing-customer-type"
            value={values.customerType}
            disabled={disabled}
            onChange={(e) =>
              patch({
                customerType: e.target.value === "individual" ? "individual" : "business",
              })
            }
            className="h-11 border-zinc-200 bg-white"
          >
            <option value="business">{t("business")}</option>
            <option value="individual">{t("individual")}</option>
          </Select>
        </div>

        <CountrySelectField
          id="billing-country"
          value={values.country}
          onChange={handleCountryChange}
          label={t("country")}
        />

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="billing-line1">{t("addressLine1")}</Label>
          <Input
            id="billing-line1"
            value={values.line1}
            disabled={disabled}
            onChange={(e) => patch({ line1: e.target.value })}
            className="h-11 border-zinc-200 bg-white"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="billing-line2">{t("addressLine2")}</Label>
          <Input
            id="billing-line2"
            value={values.line2}
            disabled={disabled}
            onChange={(e) => patch({ line2: e.target.value })}
            className="h-11 border-zinc-200 bg-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="billing-city">{t("city")}</Label>
          <Input
            id="billing-city"
            value={values.city}
            disabled={disabled}
            onChange={(e) => patch({ city: e.target.value })}
            className="h-11 border-zinc-200 bg-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="billing-pincode">{t("pincode")}</Label>
          <Input
            id="billing-pincode"
            value={values.pincode}
            disabled={disabled}
            onChange={(e) => patch({ pincode: e.target.value })}
            className="h-11 border-zinc-200 bg-white"
          />
        </div>

        {isIndia ? (
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="billing-state">{t("state")}</Label>
            <Select
              id="billing-state"
              value={values.stateCode}
              disabled={disabled}
              onChange={(e) => handleStateChange(e.target.value)}
              className="h-11 border-zinc-200 bg-white"
            >
              <option value="">{t("selectState")}</option>
              {INDIAN_LOCATIONS_SORTED.map((state) => (
                <option key={state.code} value={state.code}>
                  {state.name}
                </option>
              ))}
            </Select>
          </div>
        ) : null}

        {isIndia ? (
          <>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="billing-gst-registered">{t("gstRegistered")}</Label>
              <Select
                id="billing-gst-registered"
                value={values.gstRegistered ? "yes" : "no"}
                disabled={disabled}
                onChange={(e) =>
                  patch(
                    {
                      gstRegistered: e.target.value === "yes",
                      gstin: e.target.value === "yes" ? values.gstin : "",
                    },
                    { taxRelevant: true }
                  )
                }
                className="h-11 border-zinc-200 bg-white"
              >
                <option value="no">{t("gstNo")}</option>
                <option value="yes">{t("gstYes")}</option>
              </Select>
              <p className="text-xs text-zinc-500">{t("gstHint")}</p>
            </div>
            {values.gstRegistered ? (
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="billing-gstin">{t("gstin")}</Label>
                <Input
                  id="billing-gstin"
                  value={values.gstin}
                  disabled={disabled}
                  onChange={(e) =>
                    patch({ gstin: e.target.value.toUpperCase() })
                  }
                  className="h-11 border-zinc-200 bg-white uppercase"
                  maxLength={15}
                />
              </div>
            ) : null}
          </>
        ) : (
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="billing-tax-id">{t("taxId")}</Label>
            <Input
              id="billing-tax-id"
              value={values.taxId}
              disabled={disabled}
              onChange={(e) => patch({ taxId: e.target.value })}
              className="h-11 border-zinc-200 bg-white"
            />
            <p className="text-xs text-zinc-500">{t("exportHint")}</p>
          </div>
        )}
      </div>

      {taxPreview ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            {t("breakdownTitle")}
          </p>
          <ul className="mt-2 space-y-1.5 text-sm text-zinc-700">
            {breakdownRows.map((row) => (
              <li key={row.label} className="flex justify-between gap-3">
                <span>{row.label}</span>
                <span className="tabular-nums">{row.value}</span>
              </li>
            ))}
            <li className="flex justify-between gap-3 border-t border-zinc-100 pt-2 font-semibold text-zinc-900">
              <span>{t("total")}</span>
              <span className="tabular-nums">
                {formatMoney(taxPreview.amountInclusive)}
              </span>
            </li>
          </ul>
          {taxPreview.notes ? (
            <p className="mt-2 text-xs leading-relaxed text-zinc-500">
              {taxPreview.notes}
            </p>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
