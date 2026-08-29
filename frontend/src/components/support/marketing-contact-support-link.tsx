"use client";

import { useState } from "react";

import { ContactSupportModal } from "@/components/support/contact-support-modal";
import { cn } from "@/lib/utils";

type MarketingContactSupportLinkProps = {
  className?: string;
};

export function MarketingContactSupportLink({
  className,
}: MarketingContactSupportLinkProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "font-medium text-zinc-700 underline-offset-4 transition-colors hover:text-zinc-900 hover:underline",
          className
        )}
      >
        Contact
      </button>
      <ContactSupportModal
        open={open}
        onClose={() => setOpen(false)}
        source="public"
      />
    </>
  );
}
