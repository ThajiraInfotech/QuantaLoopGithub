"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import {
  dismissReminderRequest,
  fetchReminders,
} from "@/services/reminders/reminder.service";
import { useReminderStore } from "@/store/reminder-store";
import type { Reminder } from "@/types/reminder";

const POLL_MS = 60_000;

function reminderHref(r: Reminder): string | null {
  if (r.conversationId) return ROUTES.conversationDetail(r.conversationId);
  if (r.materialId) return ROUTES.materialDetail(r.materialId);
  if (r.interestId) return ROUTES.interests;
  return null;
}

export function RemindersStrip({ compact = false }: { compact?: boolean }) {
  const setStore = useReminderStore((s) => s.setItems);
  const removeStore = useReminderStore((s) => s.remove);
  const [items, setItems] = useState<Reminder[]>([]);

  const load = useCallback(async () => {
    try {
      const data = await fetchReminders();
      setItems(data);
      setStore(data);
    } catch {
      /* silent on dashboard poll */
    }
  }, [setStore]);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(id);
  }, [load]);

  async function dismiss(id: string) {
    try {
      await dismissReminderRequest(id);
      setItems((prev) => prev.filter((r) => r.id !== id));
      removeStore(id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not dismiss");
    }
  }

  if (items.length === 0) return null;

  return (
    <section
      className={
        compact
          ? "space-y-2"
          : "rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-4"
      }
    >
      {!compact ? (
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Follow-ups
        </h2>
      ) : null}
      <ul className="space-y-2">
        {items.slice(0, compact ? 3 : 8).map((r) => {
          const href = reminderHref(r);
          return (
            <li
              key={r.id}
              className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-zinc-100 bg-white px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-900">{r.title}</p>
                <p className="mt-0.5 text-xs text-zinc-600">{r.message}</p>
                {href ? (
                  <Link
                    href={href}
                    className="mt-1 inline-block text-xs font-medium text-zinc-800 underline-offset-4 hover:underline"
                  >
                    Open →
                  </Link>
                ) : null}
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="shrink-0 text-xs"
                onClick={() => void dismiss(r.id)}
              >
                Dismiss
              </Button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
