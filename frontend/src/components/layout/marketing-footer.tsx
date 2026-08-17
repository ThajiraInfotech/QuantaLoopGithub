import Link from "next/link";

import { ROUTES } from "@/constants/routes";

const footerLinkClass =
  "font-medium text-zinc-700 underline-offset-4 transition-colors hover:text-zinc-900 hover:underline";

export function MarketingFooter() {
  return (
    <footer className="border-t border-zinc-200/80 bg-zinc-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-sm text-zinc-600 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>© {new Date().getFullYear()} Quanta Loop. All rights reserved.</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link href={ROUTES.legalTerms} className={footerLinkClass}>
            Terms &amp; Conditions
          </Link>
          <Link href={ROUTES.legalPrivacy} className={footerLinkClass}>
            Privacy Policy
          </Link>
          <p className="text-zinc-500">
            Private industrial recovery network — matching and trust first.
          </p>
        </div>
      </div>
    </footer>
  );
}
