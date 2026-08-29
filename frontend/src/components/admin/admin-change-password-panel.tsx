"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

import { OtpCodeInput } from "@/components/auth/otp-code-input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import {
  confirmAdminPasswordChange,
  requestAdminPasswordChangeOtp,
} from "@/services/admin/admin.service";
import { useAuthStore } from "@/store/auth-store";

const passwordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters").max(128),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const confirmSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

type PasswordFormValues = z.infer<typeof passwordSchema>;
type ConfirmFormValues = z.infer<typeof confirmSchema>;

export function AdminChangePasswordPanel() {
  const user = useAuthStore((s) => s.user);
  const [step, setStep] = useState<"password" | "otp">("password");
  const [otpSentTo, setOtpSentTo] = useState<string | null>(null);
  const [pendingPasswords, setPendingPasswords] =
    useState<PasswordFormValues | null>(null);

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    mode: "onTouched",
    defaultValues: { password: "", confirmPassword: "" },
  });

  const confirmForm = useForm<ConfirmFormValues>({
    resolver: zodResolver(confirmSchema),
    mode: "onTouched",
    defaultValues: { code: "" },
  });

  const passwordErrors = passwordForm.formState.errors;
  const confirmErrors = confirmForm.formState.errors;

  const accountEmail = useMemo(() => user?.email ?? "—", [user?.email]);

  async function onRequestOtp(values: PasswordFormValues) {
    try {
      const result = await requestAdminPasswordChangeOtp(values);
      setPendingPasswords(values);
      setOtpSentTo(result.otpSentTo);
      setStep("otp");
      confirmForm.reset({ code: "" });
      toast.success("Confirmation code sent");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to send code");
    }
  }

  async function onConfirm(values: ConfirmFormValues) {
    try {
      const result = await confirmAdminPasswordChange(values);
      toast.success(result.message);
      setStep("password");
      setPendingPasswords(null);
      setOtpSentTo(null);
      passwordForm.reset({ password: "", confirmPassword: "" });
      confirmForm.reset({ code: "" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to update password");
    }
  }

  async function onResend() {
    if (!pendingPasswords) return;
    try {
      const result = await requestAdminPasswordChangeOtp(pendingPasswords);
      setOtpSentTo(result.otpSentTo);
      confirmForm.setValue("code", "");
      toast.success("Confirmation code resent");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to resend code");
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 py-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Security
        </h1>
        <p className="text-sm text-zinc-600">
          Change the admin password only. The login email stays the same.
        </p>
      </div>

      <Card className="border-zinc-200/80">
        <CardHeader>
          <CardTitle className="text-base">Admin account</CardTitle>
          <CardDescription>
            Signed in as <span className="font-medium text-zinc-800">{accountEmail}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "password" ? (
            <form
              onSubmit={passwordForm.handleSubmit(onRequestOtp)}
              className="space-y-4"
              noValidate
            >
              <div className="space-y-2">
                <Label htmlFor="admin-new-password">New password</Label>
                <PasswordInput
                  id="admin-new-password"
                  autoComplete="new-password"
                  disabled={passwordForm.formState.isSubmitting}
                  {...passwordForm.register("password")}
                />
                {passwordErrors.password?.message ? (
                  <p className="text-sm text-red-600" role="alert">
                    {passwordErrors.password.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-confirm-password">Confirm new password</Label>
                <PasswordInput
                  id="admin-confirm-password"
                  autoComplete="new-password"
                  disabled={passwordForm.formState.isSubmitting}
                  {...passwordForm.register("confirmPassword")}
                />
                {passwordErrors.confirmPassword?.message ? (
                  <p className="text-sm text-red-600" role="alert">
                    {passwordErrors.confirmPassword.message}
                  </p>
                ) : null}
              </div>
              <p className="text-xs leading-relaxed text-zinc-500">
                A confirmation code will be emailed to the root inbox before the
                password is updated.
              </p>
              <Button
                type="submit"
                disabled={passwordForm.formState.isSubmitting}
                aria-busy={passwordForm.formState.isSubmitting}
              >
                {passwordForm.formState.isSubmitting
                  ? "Sending code…"
                  : "Send confirmation code"}
              </Button>
            </form>
          ) : (
            <form
              onSubmit={confirmForm.handleSubmit(onConfirm)}
              className="space-y-4"
              noValidate
            >
              <div
                className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700"
                role="status"
              >
                Enter the 6-digit code sent to{" "}
                <span className="font-medium text-zinc-900">
                  {otpSentTo ?? "the root inbox"}
                </span>
                . Your login email will not change.
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password-otp">Confirmation code</Label>
                <Controller
                  name="code"
                  control={confirmForm.control}
                  render={({ field }) => (
                    <OtpCodeInput
                      id="admin-password-otp"
                      value={field.value}
                      onChange={field.onChange}
                      disabled={confirmForm.formState.isSubmitting}
                      error={Boolean(confirmErrors.code?.message)}
                    />
                  )}
                />
                {confirmErrors.code?.message ? (
                  <p className="text-sm text-red-600" role="alert">
                    {confirmErrors.code.message}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="submit"
                  disabled={confirmForm.formState.isSubmitting}
                  aria-busy={confirmForm.formState.isSubmitting}
                >
                  {confirmForm.formState.isSubmitting
                    ? "Updating…"
                    : "Confirm and update password"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={confirmForm.formState.isSubmitting}
                  onClick={() => void onResend()}
                >
                  Resend code
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={confirmForm.formState.isSubmitting}
                  onClick={() => {
                    setStep("password");
                    setOtpSentTo(null);
                    confirmForm.reset({ code: "" });
                  }}
                >
                  Back
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
