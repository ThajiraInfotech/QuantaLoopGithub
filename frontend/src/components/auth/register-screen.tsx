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
    <div className="flex min-h-screen flex-col">
      <div className="border-b border-border/80 bg-background">
        <div
          className={cn(
            "mx-auto flex h-16 items-center justify-between px-4 sm:px-6",
            widthClass,
          )}
        >
          <Logo />
          <LanguageSwitcher compact />
        </div>
      </div>
      {onboardingProgress ? (
        <div
          className={cn(
            "mx-auto w-full space-y-4 px-4 pt-8 sm:px-6",
            widthClass,
          )}
        >
          {onboardingProgress}
        </div>
      ) : null}
      <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className={cn("w-full", widthClass)}>
          {summary ? <div className="mb-5">{summary}</div> : null}
          <Card className="border-border/90 shadow-card">
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
              {form ?? <RegisterForm />}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
