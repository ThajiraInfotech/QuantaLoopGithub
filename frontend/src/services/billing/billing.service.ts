import { getAxiosErrorMessage, isApiError } from "@/lib/api-result";
import type {
  BillingInvoice,
  BillingProfile,
  TaxPreview,
  UpsertBillingProfileInput,
} from "@/types/billing";

import { apiClient } from "../api/client";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === "object" && value !== null
    ? (value as UnknownRecord)
    : null;
}

function unwrapResponse(value: unknown): unknown {
  if (isApiError(value)) {
    throw new Error(value.error.message);
  }
  const record = asRecord(value);
  if (!record) return value;
  if ("data" in record) return record.data;
  if ("payload" in record) return record.payload;
  return value;
}

async function request<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw new Error(getAxiosErrorMessage(error));
  }
}

function normalizeAddress(value: unknown): BillingProfile["address"] {
  const address = asRecord(value) ?? {};
  return {
    line1: typeof address.line1 === "string" ? address.line1 : "",
    line2: typeof address.line2 === "string" ? address.line2 : "",
    city: typeof address.city === "string" ? address.city : "",
    state: typeof address.state === "string" ? address.state : "",
    stateCode: typeof address.stateCode === "string" ? address.stateCode : "",
    pincode: typeof address.pincode === "string" ? address.pincode : "",
    country:
      typeof address.country === "string" && address.country
        ? address.country.toUpperCase()
        : "IN",
  };
}

function normalizeProfile(value: unknown): BillingProfile | null {
  const payload = asRecord(value);
  if (!payload) return null;
  const nested = asRecord(payload.profile) ?? payload;
  if (typeof nested.legalName !== "string" || !nested.legalName) return null;
  return {
    id: typeof nested.id === "string" ? nested.id : "",
    legalName: nested.legalName,
    billingEmail:
      typeof nested.billingEmail === "string" ? nested.billingEmail : "",
    customerType:
      nested.customerType === "individual" ? "individual" : "business",
    gstRegistered: nested.gstRegistered === true,
    gstin: typeof nested.gstin === "string" ? nested.gstin : "",
    address: normalizeAddress(nested.address),
    taxId: typeof nested.taxId === "string" ? nested.taxId : "",
    updatedAt:
      typeof nested.updatedAt === "string" ? nested.updatedAt : null,
  };
}

function normalizeTaxPreview(value: unknown): TaxPreview | null {
  const payload = asRecord(value);
  if (!payload) return null;
  const nested = asRecord(payload.taxPreview) ?? payload;
  if (typeof nested.amountInclusive !== "number") return null;
  return {
    planId: typeof nested.planId === "string" ? nested.planId : "",
    planCode: typeof nested.planCode === "string" ? nested.planCode : "",
    planName: typeof nested.planName === "string" ? nested.planName : "",
    currency: typeof nested.currency === "string" ? nested.currency : "INR",
    amountInclusive: nested.amountInclusive,
    taxableAmount:
      typeof nested.taxableAmount === "number" ? nested.taxableAmount : 0,
    cgstAmount: typeof nested.cgstAmount === "number" ? nested.cgstAmount : 0,
    sgstAmount: typeof nested.sgstAmount === "number" ? nested.sgstAmount : 0,
    igstAmount: typeof nested.igstAmount === "number" ? nested.igstAmount : 0,
    totalGstAmount:
      typeof nested.totalGstAmount === "number" ? nested.totalGstAmount : 0,
    gstRate: typeof nested.gstRate === "number" ? nested.gstRate : 0.18,
    taxType: typeof nested.taxType === "string" ? nested.taxType : "",
    taxTreatment:
      typeof nested.taxTreatment === "string" ? nested.taxTreatment : "",
    placeOfSupply:
      typeof nested.placeOfSupply === "string" ? nested.placeOfSupply : "",
    placeOfSupplyGstCode:
      typeof nested.placeOfSupplyGstCode === "string"
        ? nested.placeOfSupplyGstCode
        : null,
    sacCode: typeof nested.sacCode === "string" ? nested.sacCode : null,
    isExport: nested.isExport === true,
    supplierStateCode:
      typeof nested.supplierStateCode === "string"
        ? nested.supplierStateCode
        : "",
    notes: typeof nested.notes === "string" ? nested.notes : undefined,
  };
}

export async function getBillingProfile(): Promise<BillingProfile | null> {
  return request(async () => {
    const { data } = await apiClient.get<unknown>("/billing/profile");
    return normalizeProfile(unwrapResponse(data));
  });
}

export async function saveBillingProfile(
  input: UpsertBillingProfileInput
): Promise<{ profile: BillingProfile; taxPreview: TaxPreview }> {
  return request(async () => {
    const { data } = await apiClient.put<unknown>("/billing/profile", input);
    const unwrapped = unwrapResponse(data);
    const profile = normalizeProfile(unwrapped);
    const taxPreview = normalizeTaxPreview(unwrapped);
    if (!profile || !taxPreview) {
      throw new Error("Unexpected billing profile response");
    }
    return { profile, taxPreview };
  });
}

export async function getTaxPreview(planCode = "annual_access"): Promise<TaxPreview> {
  return request(async () => {
    const { data } = await apiClient.get<unknown>("/billing/tax-preview", {
      params: { planCode },
    });
    const taxPreview = normalizeTaxPreview(unwrapResponse(data));
    if (!taxPreview) throw new Error("Unexpected tax preview response");
    return taxPreview;
  });
}

function normalizeInvoice(value: unknown): BillingInvoice | null {
  const payload = asRecord(value);
  if (!payload) return null;
  const nested = asRecord(payload.invoice) ?? payload;
  if (
    typeof nested.invoiceNumber !== "string" ||
    typeof nested.amountInclusive !== "number"
  ) {
    return null;
  }
  const buyer = asRecord(nested.buyer) ?? {};
  return {
    id: typeof nested.id === "string" ? nested.id : "",
    invoiceNumber: nested.invoiceNumber,
    invoiceDate:
      typeof nested.invoiceDate === "string" ? nested.invoiceDate : "",
    status: typeof nested.status === "string" ? nested.status : "issued",
    currency: typeof nested.currency === "string" ? nested.currency : "INR",
    description:
      typeof nested.description === "string" ? nested.description : "",
    sacCode: typeof nested.sacCode === "string" ? nested.sacCode : null,
    placeOfSupply:
      typeof nested.placeOfSupply === "string" ? nested.placeOfSupply : "",
    placeOfSupplyGstCode:
      typeof nested.placeOfSupplyGstCode === "string"
        ? nested.placeOfSupplyGstCode
        : null,
    taxType: typeof nested.taxType === "string" ? nested.taxType : "",
    taxTreatment:
      typeof nested.taxTreatment === "string" ? nested.taxTreatment : "",
    isExport: nested.isExport === true,
    gstRate: typeof nested.gstRate === "number" ? nested.gstRate : 0.18,
    amountInclusive: nested.amountInclusive,
    taxableAmount:
      typeof nested.taxableAmount === "number" ? nested.taxableAmount : 0,
    cgstAmount: typeof nested.cgstAmount === "number" ? nested.cgstAmount : 0,
    sgstAmount: typeof nested.sgstAmount === "number" ? nested.sgstAmount : 0,
    igstAmount: typeof nested.igstAmount === "number" ? nested.igstAmount : 0,
    totalGstAmount:
      typeof nested.totalGstAmount === "number" ? nested.totalGstAmount : 0,
    buyer: {
      legalName: typeof buyer.legalName === "string" ? buyer.legalName : "",
      billingEmail:
        typeof buyer.billingEmail === "string" ? buyer.billingEmail : "",
      gstin: typeof buyer.gstin === "string" ? buyer.gstin : null,
      address: normalizeAddress(buyer.address),
    },
    razorpayPaymentId:
      typeof nested.razorpayPaymentId === "string"
        ? nested.razorpayPaymentId
        : "",
    razorpaySubscriptionId:
      typeof nested.razorpaySubscriptionId === "string"
        ? nested.razorpaySubscriptionId
        : null,
    catalogPlanId:
      typeof nested.catalogPlanId === "string" ? nested.catalogPlanId : "",
    createdAt: typeof nested.createdAt === "string" ? nested.createdAt : undefined,
  };
}

export async function listMyInvoices(): Promise<BillingInvoice[]> {
  return request(async () => {
    const { data } = await apiClient.get<unknown>("/billing/invoices");
    const unwrapped = asRecord(unwrapResponse(data));
    const items = Array.isArray(unwrapped?.invoices) ? unwrapped.invoices : [];
    return items
      .map(normalizeInvoice)
      .filter((row): row is BillingInvoice => row !== null);
  });
}

export async function openInvoiceHtml(invoiceId: string): Promise<void> {
  const { data } = await apiClient.get<string>(
    `/billing/invoices/${encodeURIComponent(invoiceId)}/html`,
    { responseType: "text" }
  );
  const blob = new Blob([data], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
