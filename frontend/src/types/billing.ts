export type BillingCustomerType = "individual" | "business";

export type BillingAddress = {
  line1: string;
  line2: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  country: string;
};

export type BillingProfile = {
  id: string;
  legalName: string;
  billingEmail: string;
  customerType: BillingCustomerType;
  gstRegistered: boolean;
  gstin: string;
  address: BillingAddress;
  taxId: string;
  updatedAt?: string | null;
};

export type TaxPreview = {
  planId: string;
  planCode: string;
  planName: string;
  currency: string;
  amountInclusive: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalGstAmount: number;
  gstRate: number;
  taxType: string;
  taxTreatment: string;
  placeOfSupply: string;
  placeOfSupplyGstCode: string | null;
  sacCode: string | null;
  isExport: boolean;
  supplierStateCode: string;
  notes?: string;
};

export type BillingInvoice = {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  status: string;
  currency: string;
  description: string;
  sacCode: string | null;
  placeOfSupply: string;
  placeOfSupplyGstCode: string | null;
  taxType: string;
  taxTreatment: string;
  isExport: boolean;
  gstRate: number;
  amountInclusive: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalGstAmount: number;
  buyer: {
    legalName: string;
    billingEmail?: string;
    gstin?: string | null;
    address?: BillingAddress;
  };
  seller?: {
    legalName?: string;
    gstin?: string | null;
  };
  catalogPlanId?: string;
  razorpayPaymentId: string;
  razorpaySubscriptionId?: string | null;
  razorpayOrderId?: string | null;
  createdAt?: string;
};

export type AdminInvoiceRow = BillingInvoice & {
  user: {
    id: string;
    email: string;
    companyName: string;
    name: string;
  } | null;
};

export type AdminInvoicesSummary = {
  invoiceCount: number;
  exportCount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalGstAmount: number;
  amountInclusive: number;
};

export type AdminInvoicesResult = {
  items: AdminInvoiceRow[];
  total: number;
  page: number;
  limit: number;
  month: string | null;
  summary: AdminInvoicesSummary;
};

export type UpsertBillingProfileInput = {
  legalName: string;
  billingEmail?: string;
  customerType: BillingCustomerType;
  gstRegistered: boolean;
  gstin?: string;
  taxId?: string;
  address: BillingAddress;
};
