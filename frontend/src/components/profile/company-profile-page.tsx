"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";

import { RoleBadge } from "@/components/trust/role-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { patchMyProfile } from "@/services/profile/profile.service";
import { useAuthStore } from "@/store/auth-store";
import { useProfileTrustStore } from "@/store/profile-trust-store";
import type { User } from "@/types/user";
import {
  companyFormToPatch,
  companyProfileFormSchema,
  type CompanyProfileFormValues,
} from "@/validations/profile";

function buildDefaults(user: User): CompanyProfileFormValues {
  return {
    name: user.name,
    companyName: user.companyName,
    companyDescription: user.companyDescription ?? "",
    website: user.website ?? "",
    industriesText: (user.industriesHandled ?? []).join(", "),
    materialsText: (user.materialTypes ?? []).join(", "),
    industryType: user.industryType ?? "",
    operationalLocation: user.operationalLocation ?? "",
    location: user.location ?? "",
    employeeRange: user.employeeRange ?? "",
    establishedYear:
      user.establishedYear != null ? String(user.establishedYear) : "",
    responseRate: user.responseRate ?? 0,
    averageResponseTime: user.averageResponseTime ?? "",
  };
}

export function CompanyProfilePage() {
  const t = useTranslations("profile.company");
  const tf = useTranslations("profile.company.fields");
  const user = useAuthStore((s) => s.user);
  const syncUser = useAuthStore((s) => s.syncUser);
  const trustSignals = useProfileTrustStore((s) => s.trustSignals);
  const refreshTrust = useProfileTrustStore((s) => s.refresh);
  const profileLoadError = useProfileTrustStore((s) => s.error);
  const [saveStatus, setSaveStatus] = useState<"success" | "error" | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const form = useForm<CompanyProfileFormValues>({
    resolver: zodResolver(
      companyProfileFormSchema
    ) as Resolver<CompanyProfileFormValues>,
    defaultValues: user ? buildDefaults(user) : undefined,
  });

  const resetFromUser = useCallback(
    (next: User) => {
      form.reset(buildDefaults(next));
    },
    [form]
  );

  useEffect(() => {
    void refreshTrust();
  }, [refreshTrust]);

  useEffect(() => {
    if (user) resetFromUser(user);
  }, [user, resetFromUser]);

  if (!user) {
    return null;
  }

  async function onSubmit(values: CompanyProfileFormValues) {
    setSaveStatus(null);
    setSaveError(null);
    try {
      const body = companyFormToPatch(values);
      const { profile, trustSignals: nextSignals } = await patchMyProfile(
        body
      );
      syncUser(profile);
      useProfileTrustStore.getState().setTrustSignals(nextSignals);
      resetFromUser(profile);
      setSaveStatus("success");
    } catch (e) {
      setSaveStatus("error");
      setSaveError(e instanceof Error ? e.message : t("saveError"));
    }
  }

  const completion = user.profileCompletion ?? 0;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            {t("title")}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-600">
            {t("subtitle")}
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <RoleBadge role={user.role} />
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              {t("profileStrength")}
            </p>
            <p className="text-lg font-semibold tabular-nums text-zinc-900">
              {completion}%
            </p>
          </div>
        </div>
      </div>

      {profileLoadError ? (
        <p className="text-sm text-amber-800">{profileLoadError}</p>
      ) : null}

      {trustSignals && trustSignals.labels.length > 0 ? (
        <Card className="border-zinc-200/80">
          <CardHeader>
            <CardTitle className="text-base">{t("networkSignals.title")}</CardTitle>
            <CardDescription>{t("networkSignals.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-zinc-800">
              {trustSignals.labels.map((label) => (
                <li
                  key={label}
                  className="rounded-md border border-zinc-100 bg-zinc-50/80 px-3 py-2"
                >
                  {label}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8"
        noValidate
      >
        <Card className="border-zinc-200/80">
          <CardHeader>
            <CardTitle className="text-base">{t("overview.title")}</CardTitle>
            <CardDescription>{t("overview.description")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="companyName">{tf("companyName")}</Label>
              <Input id="companyName" {...form.register("companyName")} />
              {form.formState.errors.companyName?.message ? (
                <p className="text-sm text-red-600" role="alert">
                  {form.formState.errors.companyName.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="companyDescription">{tf("companyDescription")}</Label>
              <Textarea
                id="companyDescription"
                rows={5}
                className="resize-y border-zinc-200"
                {...form.register("companyDescription")}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="website">{tf("website")}</Label>
              <Input
                id="website"
                type="url"
                placeholder={tf("websitePlaceholder")}
                {...form.register("website")}
              />
              {form.formState.errors.website?.message ? (
                <p className="text-sm text-red-600" role="alert">
                  {form.formState.errors.website.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">{tf("contactName")}</Label>
              <Input id="name" {...form.register("name")} />
              {form.formState.errors.name?.message ? (
                <p className="text-sm text-red-600" role="alert">
                  {form.formState.errors.name.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="employeeRange">{tf("employeeRange")}</Label>
              <Input
                id="employeeRange"
                placeholder={tf("employeePlaceholder")}
                {...form.register("employeeRange")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="establishedYear">{tf("establishedYear")}</Label>
              <Input id="establishedYear" {...form.register("establishedYear")} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200/80">
          <CardHeader>
            <CardTitle className="text-base">{t("operational.title")}</CardTitle>
            <CardDescription>{t("operational.description")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="industryType">{tf("industryType")}</Label>
              <Input id="industryType" {...form.register("industryType")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industriesText">{tf("industriesText")}</Label>
              <Textarea
                id="industriesText"
                rows={3}
                className="resize-y border-zinc-200"
                {...form.register("industriesText")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="materialsText">{tf("materialsText")}</Label>
              <Textarea
                id="materialsText"
                rows={3}
                className="resize-y border-zinc-200"
                {...form.register("materialsText")}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="operationalLocation">{tf("operationalLocation")}</Label>
                <Input
                  id="operationalLocation"
                  {...form.register("operationalLocation")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">{tf("locationOnFile")}</Label>
                <Input id="location" {...form.register("location")} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200/80">
          <CardHeader>
            <CardTitle className="text-base">{t("response.title")}</CardTitle>
            <CardDescription>{t("response.description")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="responseRate">{tf("responseRate")}</Label>
              <Input
                id="responseRate"
                type="number"
                min={0}
                max={100}
                {...form.register("responseRate", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="averageResponseTime">{tf("responseWindow")}</Label>
              <Input
                id="averageResponseTime"
                placeholder={tf("responseWindowPlaceholder")}
                {...form.register("averageResponseTime")}
              />
            </div>
          </CardContent>
        </Card>

        {saveStatus ? (
          <p
            className={
              saveStatus === "success"
                ? "text-sm text-zinc-700"
                : "text-sm text-red-600"
            }
            role="status"
          >
            {saveStatus === "success" ? t("saved") : saveError ?? t("saveError")}
          </p>
        ) : null}

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? t("saving") : t("saveProfile")}
        </Button>
      </form>
    </div>
  );
}
