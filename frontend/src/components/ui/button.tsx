import { forwardRef } from "react";

import { cn } from "@/lib/utils";
import type { ButtonVariant } from "@/lib/design-tokens";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
};

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary",
  accent:
    "bg-accent text-accent-foreground hover:bg-accent/90 active:bg-accent",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-secondary/80",
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

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant = "primary", size = "md", type = "button", ...props },
    ref
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:pointer-events-none disabled:opacity-50",
          variant !== "link" && sizeStyles[size],
          variantStyles[variant],
          className
        )}
        {...props}
      />
    );
  }
);
