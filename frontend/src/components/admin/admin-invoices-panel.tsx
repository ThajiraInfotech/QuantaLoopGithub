"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  fetchAdminInvoices,
  fetchAllAdminInvoices,
  openAdminInvoiceHtml,
} from "@/services/admin/admin.service";
import type { AdminInvoiceRow, AdminInvoicesSummary } from "@/types/billing";
import { formatMediumDate } from "@/utils/format-relative-time";

const SEARCH_DEBOUNCE_MS = 400;

type TaxFilter = "all" | "cgst_sgst" | "igst" | "export_zero_rated";

function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function money(amount: number, currency = "INR") {
  const code = String(currency || "INR").toUpperCase();
  if (code === "USD") {
    return `$${Number(amount || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return `₹${Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function taxLabel(taxType: string) {
  if (taxType === "cgst_sgst") return "CGST+SGST";
  if (taxType === "igst") return "IGST";
  if (taxType === "export_zero_rated") return "Export";
  return taxType || "—";
}

function downloadInvoicesCsv(rows: AdminInvoiceRow[], month: string) {
  const escape = (value: string) => {
    if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
    return value;
  };

  const header = [
    "Invoice Number",
    "Invoice Date",
    "Customer Name",
    "Customer Email",
    "Customer GSTIN",
    "Country",
    "Place of Supply",
    "Place of Supply GST Code",
    "SAC",
    "Tax Type",
    "Tax Treatment",
    "Export",
    "Taxable Value",
    "CGST",
    "SGST",
    "IGST",
    "Total GST",
    "Invoice Total",
    "Razorpay Payment ID",
    "User Company",
    "User Email",
  ];

  const lines = [
    header.join(","),
    ...rows.map((row) =>
      [
        row.invoiceNumber,
        row.invoiceDate ? new Date(row.invoiceDate).toISOString().slice(0, 10) : "",
        row.buyer?.legalName ?? "",
        row.buyer?.billingEmail ?? "",
        row.buyer?.gstin ?? "",
        row.buyer?.address?.country ?? "",
        row.placeOfSupply,
        row.placeOfSupplyGstCode ?? "",
        row.sacCode ?? "",
        taxLabel(row.taxType),
        row.taxTreatment,
        row.isExport ? "Y" : "N",
        String(row.taxableAmount),
        String(row.cgstAmount),
        String(row.sgstAmount),
        String(row.igstAmount),
        String(row.totalGstAmount),
        String(row.amountInclusive),
        row.razorpayPaymentId,
        row.user?.companyName ?? "",
        row.user?.email ?? "",
      ]
        .map((value) => escape(String(value ?? "")))
        .join(",")
    ),
  ];

  const blob = new Blob([lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `quanta-loop-gst-invoices-${month || "all"}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function emptySummary(): AdminInvoicesSummary {
  return {
    invoiceCount: 0,
    exportCount: 0,
    taxableAmount: 0,
    cgstAmount: 0,
    sgstAmount: 0,
    igstAmount: 0,
    totalGstAmount: 0,
    amountInclusive: 0,
  };
}

export function AdminInvoicesPanel() {
  const [month, setMonth] = useState(currentMonthValue);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [taxType, setTaxType] = useState<TaxFilter>("all");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<AdminInvoiceRow[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<AdminInvoicesSummary>(emptySummary);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const limit = 50;

  useEffect(() => {
    const id = window.setTimeout(
      () => setDebouncedSearch(search.trim()),
      SEARCH_DEBOUNCE_MS
    );
    return () => window.clearTimeout(id);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchAdminInvoices({
        month: month || undefined,
        search: debouncedSearch || undefined,
        taxType,
        page,
        limit,
      });
      setItems(result.items);
      setTotal(result.total);
      setSummary(result.summary);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to load invoices"
      );
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, month, page, taxType]);

  useEffect(() => {
    void load();
  }, [load]);

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(total / limit)),
    [total]
  );

  async function handleExport() {
    setExporting(true);
    try {
      const rows = await fetchAllAdminInvoices({
        month: month || undefined,
        search: debouncedSearch || undefined,
        taxType,
      });
      if (!rows.length) {
        toast.error("No invoices to export for this filter");
        return;
      }
      downloadInvoicesCsv(rows, month || "all");
      toast.success(`Exported ${rows.length} invoices`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Export failed"
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-6 sm:py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
            Billing & GST invoices
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Monthly invoice ledger for accounting and GST filing. Razorpay
            payment IDs are linked for reconciliation.
          </p>
        </div>
        <Button
          variant="outline"
          disabled={exporting || loading}
          onClick={() => void handleExport()}
        >
          {exporting ? "Exporting…" : "Export CSV"}
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-zinc-200/80">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wide">
              Invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">
              {summary.invoiceCount}
            </p>
          </CardContent>
        </Card>
        <Card className="border-zinc-200/80">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wide">
              Taxable value
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {money(summary.taxableAmount)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-zinc-200/80">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wide">
              Total GST
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {money(summary.totalGstAmount)}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              CGST {money(summary.cgstAmount)} · SGST {money(summary.sgstAmount)}{" "}
              · IGST {money(summary.igstAmount)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-zinc-200/80">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wide">
              Collected
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {money(summary.amountInclusive)}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Exports: {summary.exportCount}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-zinc-200/80">
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>
            Filter by calendar month (YYYY-MM), tax type, or customer details.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-600" htmlFor="month">
              Month
            </label>
            <Input
              id="month"
              type="month"
              value={month}
              onChange={(e) => {
                setPage(1);
                setMonth(e.target.value);
              }}
              className="h-10"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-600" htmlFor="taxType">
              Tax type
            </label>
            <Select
              id="taxType"
              value={taxType}
              onChange={(e) => {
                setPage(1);
                setTaxType(e.target.value as TaxFilter);
              }}
              className="h-10"
            >
              <option value="all">All</option>
              <option value="cgst_sgst">CGST + SGST (Tamil Nadu)</option>
              <option value="igst">IGST (other states)</option>
              <option value="export_zero_rated">Export</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-600" htmlFor="search">
              Search
            </label>
            <Input
              id="search"
              value={search}
              placeholder="Invoice, GSTIN, customer, payment ID"
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              className="h-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-200/80">
        <CardHeader>
          <CardTitle className="text-base">
            {loading ? "Loading invoices…" : `${total} invoice${total === 1 ? "" : "s"}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {items.length === 0 && !loading ? (
            <p className="text-sm text-zinc-500">
              No invoices match this month / filter yet.
            </p>
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-2 py-2 font-medium">Invoice</th>
                  <th className="px-2 py-2 font-medium">Customer</th>
                  <th className="px-2 py-2 font-medium">Place of supply</th>
                  <th className="px-2 py-2 font-medium">Tax</th>
                  <th className="px-2 py-2 font-medium text-right">Total</th>
                  <th className="px-2 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} className="border-b border-zinc-100 align-top">
                    <td className="px-2 py-3">
                      <div className="font-medium text-zinc-900">
                        {row.invoiceNumber}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {formatMediumDate(row.invoiceDate)}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div>{row.buyer?.legalName || "—"}</div>
                      <div className="text-xs text-zinc-500">
                        {row.buyer?.gstin || "No GSTIN"}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {row.user?.email || ""}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      {row.placeOfSupply || "—"}
                      {row.placeOfSupplyGstCode
                        ? ` (${row.placeOfSupplyGstCode})`
                        : ""}
                    </td>
                    <td className="px-2 py-3">
                      <div>{taxLabel(row.taxType)}</div>
                      <div className="text-xs text-zinc-500">
                        Taxable {money(row.taxableAmount, row.currency)}
                      </div>
                    </td>
                    <td className="px-2 py-3 text-right tabular-nums font-medium">
                      {money(row.amountInclusive, row.currency)}
                    </td>
                    <td className="px-2 py-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          void openAdminInvoiceHtml(row.id).catch((error) =>
                            toast.error(
                              error instanceof Error
                                ? error.message
                                : "Unable to open invoice"
                            )
                          )
                        }
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {pageCount > 1 ? (
            <div className="mt-4 flex items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <p className="text-xs text-zinc-500">
                Page {page} of {pageCount}
              </p>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pageCount || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
