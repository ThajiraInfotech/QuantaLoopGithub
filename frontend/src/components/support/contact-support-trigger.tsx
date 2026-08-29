"use client";

import { useState } from "react";

import { ContactSupportModal } from "@/components/support/contact-support-modal";
import { cn } from "@/lib/utils";
import type { SupportSource } from "@/validations/support";

type ContactSupportTriggerProps = {
  label: string;
  source?: SupportSource;
  className?: string;
};

export function ContactSupportTrigger({
  label,
  source = "public",
  className,
}: ContactSupportTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "text-left text-small font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground",
          className
        )}
      >
        {label}
      </button>
      <ContactSupportModal
        open={open}
        onClose={() => setOpen(false)}
        source={source}
      />
    </>
  );
}
