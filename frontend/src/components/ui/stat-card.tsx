import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type StatCardProps = {
  label: string;
  value: React.ReactNode;
  hint?: string;
  trend?: React.ReactNode;
  className?: string;
};

/**
 * Dashboard metric tile — premium B2B, not marketplace KPI flash.
 */
export function StatCard({ label, value, hint, trend, className }: StatCardProps) {
  return (
    <Card variant="stat" className={className}>
      <CardHeader className="pb-2">
        <CardDescription className="text-caption uppercase tracking-wide">
          {label}
        </CardDescription>
        <CardTitle className="mt-2 text-h3 tabular-nums">{value}</CardTitle>
      </CardHeader>
      {(hint || trend) && (
        <CardContent className={cn("pt-0", !hint && !trend && "hidden")}>
          {hint ? <p className="text-small text-muted-foreground">{hint}</p> : null}
          {trend ? <div className="mt-2">{trend}</div> : null}
        </CardContent>
      )}
    </Card>
  );
}
