"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  listMyInvoices,
  openInvoiceHtml,
} from "@/services/billing/billing.service";
import type { BillingInvoice } from "@/types/billing";
import { formatMediumDate } from "@/utils/format-relative-time";

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

function taxLabel(taxType: string, t: (key: string) => string) {
  if (taxType === "cgst_sgst") return t("taxCgstSgst");
  if (taxType === "igst") return t("taxIgst");
  if (taxType === "export_zero_rated") return t("taxExport");
  return taxType || "—";
}

export function ProfilePaymentsSection() {
  const t = useTranslations("profile.payments");
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listMyInvoices()
      .then((rows) => {
        if (!cancelled) setInvoices(rows);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t("loadError"));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  return (
    <Card className="border-zinc-200/80">
      <CardHeader className="p-4 sm:p-6 sm:pb-0">
        <CardTitle className="text-base">{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 p-4 sm:p-6">
        {loading ? (
          <p className="text-sm text-zinc-500">{t("loading")}</p>
        ) : error ? (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        ) : invoices.length === 0 ? (
          <p className="text-sm text-zinc-500">{t("empty")}</p>
        ) : (
          <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200">
            {invoices.map((invoice) => (
              <li
                key={invoice.id}
                className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-zinc-900">
                    {invoice.invoiceNumber}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {formatMediumDate(invoice.invoiceDate)} ·{" "}
                    {taxLabel(invoice.taxType, t)}
                  </p>
                  <p className="mt-1 text-sm tabular-nums text-zinc-700">
                    {money(invoice.amountInclusive, invoice.currency)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={() =>
                    void openInvoiceHtml(invoice.id).catch(() => {
                      setError(t("openError"));
                    })
                  }
                >
                  {t("viewInvoice")}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
