import { cn } from "@/lib/utils";
import type { CardVariant } from "@/lib/design-tokens";

const cardVariants: Record<CardVariant, string> = {
  default: "border-border bg-card shadow-card",
  elevated: "border-border bg-card shadow-elevated",
  muted: "border-transparent bg-muted shadow-none",
  interactive:
    "border-border bg-card shadow-card transition-colors hover:border-muted-foreground/25 hover:shadow-elevated",
  stat: "border-border bg-card shadow-subtle",
};

export type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
};

export function Card({ className, variant = "default", ...props }: CardProps) {
  return (
    <div
      className={cn("rounded-xl border", cardVariants[variant], className)}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pb-0", className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "font-heading text-h4 text-card-foreground",
        className
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("mt-1 text-small text-muted-foreground", className)} {...props} />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center border-t border-border p-6 pt-4", className)}
      {...props}
    />
  );
}
