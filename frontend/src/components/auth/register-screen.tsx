import { RegisterForm } from "@/components/forms/register-form";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { Logo } from "@/components/shared/logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type RegisterScreenProps = {
  onboardingProgress?: React.ReactNode;
  summary?: React.ReactNode;
  title?: string;
  description?: string;
  wide?: boolean;
  form?: React.ReactNode;
};

/** Shared create-account layout */
export function RegisterScreen({
  onboardingProgress,
  summary,
  title = "Create account",
  description = "Join as a material provider or buyer. Admin access is issued separately.",
  wide = false,
  form,
}: RegisterScreenProps) {
  const widthClass = wide ? "max-w-[720px]" : "max-w-md";

  return (
    <div className="flex min-h-svh flex-col overflow-x-hidden bg-zinc-50">
      <div className="border-b border-border/80 bg-background pt-[env(safe-area-inset-top)]">
        <div
          className={cn(
            "mx-auto flex h-14 items-center justify-between gap-3 px-4 sm:h-16 sm:px-6",
            widthClass
          )}
        >
          <Logo className="h-8 sm:h-9" />
          <LanguageSwitcher compact />
        </div>
      </div>
      {onboardingProgress ? (
        <div
          className={cn(
            "mx-auto w-full space-y-3 px-4 pt-5 sm:space-y-4 sm:px-6 sm:pt-8",
            widthClass
          )}
        >
          {onboardingProgress}
        </div>
      ) : null}
      <div className="flex flex-1 items-start justify-center px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:items-center sm:px-6 sm:py-12">
        <div className={cn("w-full", widthClass)}>
          {summary ? <div className="mb-4 sm:mb-5">{summary}</div> : null}
          <Card className="border-border/90 shadow-card">
            <CardHeader className="p-4 pb-0 sm:p-6 sm:pb-0">
              <CardTitle className="text-xl leading-snug text-balance sm:text-h4">
                {title}
              </CardTitle>
              <CardDescription className="text-pretty">
                {description}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {form ?? <RegisterForm />}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
