import { cn } from "@/lib/utils";

export function primaryActionLinkClassName(className?: string) {
  return cn(
    "inline-flex h-10 items-center justify-center rounded-md bg-[#33B573] px-4 text-small font-medium text-white transition-colors hover:bg-[#2e9f66]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    className
  );
}

export function secondaryActionLinkClassName(className?: string) {
  return cn(
    "inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-small font-medium text-foreground transition-colors hover:bg-muted",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    className
  );
}
