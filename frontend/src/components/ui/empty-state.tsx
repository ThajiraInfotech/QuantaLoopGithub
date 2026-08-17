import { cn } from "@/lib/utils";

export type EmptyStateProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

/**
 * Calm operational empty state — no illustration overload.
 */
export function EmptyState({
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/50 px-6 py-12 text-center",
        className
      )}
    >
      <h3 className="font-heading text-h4 text-foreground">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-md text-small text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
