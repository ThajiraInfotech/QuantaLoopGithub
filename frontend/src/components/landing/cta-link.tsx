import Link from "next/link";

import type { ButtonVariant } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary/90",
  accent: "bg-accent text-accent-foreground hover:bg-accent/90",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  outline:
    "border border-border bg-background text-foreground hover:bg-muted",
  ghost: "text-foreground hover:bg-muted",
  destructive:
    "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  link: "text-accent underline-offset-4 hover:underline h-auto px-0",
};

const sizeStyles = {
  sm: "h-9 px-3 text-small",
  md: "h-10 px-4 text-small",
  lg: "h-11 px-5 text-body",
};

export type CtaLinkProps = {
  href: string;
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
  children: React.ReactNode;
};

export function CtaLink({
  href,
  variant = "primary",
  size = "md",
  className,
  onClick,
  children,
}: CtaLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-[color,background-color,border-color,box-shadow] duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        variant !== "link" && sizeStyles[size],
        variantStyles[variant],
        className
      )}
    >
      {children}
    </Link>
  );
}
