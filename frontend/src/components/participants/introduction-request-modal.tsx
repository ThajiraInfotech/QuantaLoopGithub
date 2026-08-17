"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/ui/select-field";
import { Textarea } from "@/components/ui/textarea";
import { requestIntroduction } from "@/services/network/network.service";
import type { Material } from "@/types/material";
import type { ProviderMatchBuyer } from "@/services/matches/match.service";

type IntroductionRequestModalProps = {
  open: boolean;
  buyer: ProviderMatchBuyer | null;
  materials: Material[];
  onClose: () => void;
  onSent?: () => void;
};

function buildDefaultMessage(
  material: Material | undefined,
  buyerName: string,
  t: (key: string, values?: Record<string, string | number>) => string
): string {
  if (!material) {
    return t("defaultMessage", { name: buyerName });
  }
  const qty =
    material.quantity > 0
      ? t("qtySuffix", {
          quantity: material.quantity,
          unit: material.unit,
        })
      : "";
  return t("materialMessage", {
    name: buyerName,
    type: material.materialType,
    title: material.title,
    qty,
  });
}

export function IntroductionRequestModal({
  open,
  buyer,
  materials,
  onClose,
  onSent,
}: IntroductionRequestModalProps) {
  const t = useTranslations("dashboard.participants.intro");
  const tCommon = useTranslations("common");
  const [materialId, setMaterialId] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !buyer) return;
    const first = materials[0];
    setMaterialId(first?.id ?? "");
    setMessage(buildDefaultMessage(first, buyer.companyName, t));
  }, [open, buyer, materials, t]);

  if (!open || !buyer) return null;

  async function send() {
    if (!buyer) return;
    setBusy(true);
    try {
      await requestIntroduction({
        buyerId: buyer.buyerId,
        materialId: materialId || undefined,
        message: message.trim() || undefined,
      });
      toast.success(t("sent"));
      onSent?.();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("sendError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-zinc-950/45 backdrop-blur-[1px]"
        aria-label={t("dismiss")}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="intro-dialog-title"
        className="relative z-10 w-full max-w-lg rounded-xl border border-zinc-200/90 bg-white p-6 shadow-xl shadow-zinc-950/15 sm:p-8"
      >
        <h2
          id="intro-dialog-title"
          className="text-lg font-semibold tracking-tight text-zinc-900"
        >
          {t("title")}
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          {t("toPrefix")}{" "}
          <span className="font-medium text-zinc-900">{buyer.companyName}</span>
          {t("toSuffix")}
        </p>

        <div className="mt-6 space-y-4">
          {materials.length > 0 ? (
            <div className="space-y-2">
              <Label htmlFor="intro-material">{t("materialLabel")}</Label>
              <SelectField
                id="intro-material"
                value={materialId}
                onChange={(e) => {
                  const id = e.target.value;
                  setMaterialId(id);
                  const mat = materials.find((m) => m.id === id);
                  setMessage(buildDefaultMessage(mat, buyer.companyName, t));
                }}
              >
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title} · {m.materialType}
                  </option>
                ))}
              </SelectField>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
              {t("noMaterials")}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="intro-message">{t("messageLabel")}</Label>
            <Textarea
              id="intro-message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" disabled={busy} onClick={onClose}>
            {tCommon("cancel")}
          </Button>
          <Button
            type="button"
            disabled={busy || materials.length === 0}
            onClick={() => void send()}
          >
            {busy ? t("sending") : t("send")}
          </Button>
        </div>
      </div>
    </div>
  );
}
