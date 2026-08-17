"use client";

import { useMemo, useState } from "react";

import { ReportModal, type ReportModalTarget } from "@/components/reports/report-modal";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

export type ReportActionItem = {
  label: string;
  targetType: "material" | "participant";
  targetMaterialId?: string;
  targetUserId?: string;
  subjectLabel: string;
  contextNote?: string;
};

type ReportActionsProps = {
  items: ReportActionItem[];
  className?: string;
  buttonClassName?: string;
};

function toModalTarget(item: ReportActionItem): ReportModalTarget {
  return {
    targetType: item.targetType,
    targetMaterialId: item.targetMaterialId,
    targetUserId: item.targetUserId,
    subjectLabel: item.subjectLabel,
    contextNote: item.contextNote,
  };
}

export function ReportActions({
  items,
  className,
  buttonClassName,
}: ReportActionsProps) {
  const user = useAuthStore((s) => s.user);
  const [active, setActive] = useState<ReportActionItem | null>(null);

  const visibleItems = useMemo(() => {
    if (!user || user.role === "admin") return [];
    return items.filter((item) => {
      if (
        item.targetType === "participant" &&
        item.targetUserId &&
        item.targetUserId === user.id
      ) {
        return false;
      }
      return true;
    });
  }, [items, user]);

  if (visibleItems.length === 0) return null;

  const triggerClass =
    buttonClassName ??
    "text-xs font-medium text-zinc-500 underline-offset-4 hover:text-zinc-800 hover:underline";

  return (
    <>
      <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-1", className)}>
        {visibleItems.map((item) => (
          <button
            key={`${item.targetType}-${item.targetMaterialId ?? item.targetUserId}-${item.label}`}
            type="button"
            className={triggerClass}
            onClick={() => setActive(item)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <ReportModal
        open={active !== null}
        target={active ? toModalTarget(active) : null}
        onClose={() => setActive(null)}
      />
    </>
  );
}
