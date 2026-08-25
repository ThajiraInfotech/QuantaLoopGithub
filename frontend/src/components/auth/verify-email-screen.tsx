import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { Logo } from "@/components/shared/logo";

type VerifyEmailScreenProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

/** Phone-first OTP layout — no nested login card on small screens. */
export function VerifyEmailScreen({
  title,
  description,
  children,
}: VerifyEmailScreenProps) {
  return (
    <div className="flex min-h-svh flex-col overflow-x-hidden bg-white sm:bg-zinc-50">
      <header className="border-b border-zinc-200/80 bg-white pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-14 w-full max-w-lg items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
          <Logo className="h-8 sm:h-9" />
          <LanguageSwitcher compact />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-10">
        <h1 className="text-[1.375rem] font-semibold leading-tight tracking-tight text-balance text-zinc-900 sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 hidden text-sm leading-relaxed text-pretty text-zinc-600 sm:mt-3 sm:block sm:text-base">
          {description}
        </p>
        <div className="mt-6 sm:mt-8">{children}</div>
      </main>
    </div>
  );
}
