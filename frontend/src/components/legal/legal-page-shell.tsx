import { LegalBackLink } from "@/components/legal/legal-back-link";
import { LandingFooter } from "@/components/landing/landing-footer";
import { Logo } from "@/components/shared/logo";

type LegalPageShellProps = {
  title: string;
  children: React.ReactNode;
};

export async function LegalPageShell({ title, children }: LegalPageShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border/80">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <LegalBackLink />
        </div>
      </header>
      <main className="flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <article className="mx-auto max-w-3xl">
          <h1 className="sr-only">{title}</h1>
          <div className="space-y-8 text-body text-muted-foreground">
            {children}
          </div>
        </article>
      </main>
      <LandingFooter />
    </div>
  );
}
