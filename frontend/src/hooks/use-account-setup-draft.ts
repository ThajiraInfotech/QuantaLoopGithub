"use client";

import { useEffect, useRef } from "react";
import type { Path, PathValue, UseFormReturn } from "react-hook-form";

import { useOnboardingHydration } from "@/hooks/use-onboarding-hydration";
import {
  type AccountSetupDraft,
  useOnboardingStore,
} from "@/store/onboarding-store";

type AccountSetupFormFields = {
  name?: string;
  companyName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

function setDraftField<T extends AccountSetupFormFields>(
  form: UseFormReturn<T>,
  name: keyof AccountSetupFormFields & string,
  value: string,
) {
  form.setValue(name as Path<T>, value as PathValue<T, Path<T>>);
}

type UseAccountSetupDraftOptions = {
  includeEmail?: boolean;
  fallbackName?: string;
  fallbackCompanyName?: string;
  fallbackEmail?: string;
};

function draftFromFormValues(
  values: AccountSetupFormFields,
  legalConsent: boolean,
  includeEmail: boolean,
): Partial<AccountSetupDraft> {
  const next: Partial<AccountSetupDraft> = {
    name: typeof values.name === "string" ? values.name : "",
    companyName: typeof values.companyName === "string" ? values.companyName : "",
    password: typeof values.password === "string" ? values.password : "",
    confirmPassword:
      typeof values.confirmPassword === "string" ? values.confirmPassword : "",
    legalConsent,
  };
  if (includeEmail) {
    next.email = typeof values.email === "string" ? values.email : "";
  }
  return next;
}

export function useAccountSetupDraftPersistence<T extends AccountSetupFormFields>(
  form: UseFormReturn<T>,
  legalConsent: boolean,
  setLegalConsent: (checked: boolean) => void,
  options: UseAccountSetupDraftOptions = {},
) {
  const hydrated = useOnboardingHydration();
  const setDraftAccountSetup = useOnboardingStore((s) => s.setDraftAccountSetup);
  const restoredRef = useRef(false);
  const legalConsentRef = useRef(legalConsent);
  const includeEmail = options.includeEmail !== false;

  legalConsentRef.current = legalConsent;

  useEffect(() => {
    if (!hydrated || restoredRef.current) return;
    restoredRef.current = true;

    const draft = useOnboardingStore.getState().draftAccountSetup;
    const nextName = draft.name || options.fallbackName || "";
    const nextCompany = draft.companyName || options.fallbackCompanyName || "";
    const nextEmail = draft.email || options.fallbackEmail || "";

    if (nextName) setDraftField(form, "name", nextName);
    if (nextCompany) setDraftField(form, "companyName", nextCompany);
    if (includeEmail && nextEmail) {
      setDraftField(form, "email", nextEmail);
    }
    if (draft.password) {
      setDraftField(form, "password", draft.password);
    }
    if (draft.confirmPassword) {
      setDraftField(form, "confirmPassword", draft.confirmPassword);
    }
    if (draft.legalConsent) setLegalConsent(true);

    setDraftAccountSetup(
      draftFromFormValues(form.getValues(), draft.legalConsent, includeEmail),
    );
  }, [
    form,
    hydrated,
    includeEmail,
    options.fallbackCompanyName,
    options.fallbackEmail,
    options.fallbackName,
    setDraftAccountSetup,
    setLegalConsent,
  ]);

  useEffect(() => {
    if (!hydrated) return;

    const subscription = form.watch((values) => {
      if (!restoredRef.current) return;
      setDraftAccountSetup(
        draftFromFormValues(
          values as AccountSetupFormFields,
          legalConsentRef.current,
          includeEmail,
        ),
      );
    });

    return () => subscription.unsubscribe();
  }, [form, hydrated, includeEmail, setDraftAccountSetup]);

  useEffect(() => {
    if (!hydrated || !restoredRef.current) return;
    setDraftAccountSetup({ legalConsent });
  }, [hydrated, legalConsent, setDraftAccountSetup]);

  useEffect(() => {
    return () => {
      if (!restoredRef.current) return;
      useOnboardingStore.getState().setDraftAccountSetup(
        draftFromFormValues(
          form.getValues(),
          legalConsentRef.current,
          includeEmail,
        ),
      );
    };
  }, [form, includeEmail]);
}
