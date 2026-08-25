import type { Notification } from "@/types/notification";

export type NotificationSyncPayload = {
  unreadCount: number;
  items: Notification[];
  at: string;
};

export type NotificationStreamStatus =
  | "connecting"
  | "live"
  | "polling"
  | "offline";

export function getNotificationStreamUrl(): string {
  return "/notifications/stream";
}

export async function* readNotificationSseStream(
  url: string,
  token: string | null,
  signal: AbortSignal
): AsyncGenerator<{ event: string; data: unknown }> {
  const headers: HeadersInit = {
    Accept: "text/event-stream",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers,
    credentials: "include",
    signal,
  });

  if (!response.ok) {
    throw new Error(`Notification stream failed (${response.status})`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Notification stream is not readable");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";

    for (const chunk of chunks) {
      if (!chunk.trim()) continue;

      let event = "message";
      const dataLines: string[] = [];

      for (const line of chunk.split("\n")) {
        if (line.startsWith("event:")) {
          event = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
          dataLines.push(line.slice(5).trim());
        }
      }

      if (!dataLines.length) continue;

      try {
        yield { event, data: JSON.parse(dataLines.join("\n")) };
      } catch {
        /* ignore malformed frames */
      }
    }
  }
}

export function isNotificationSyncPayload(
  value: unknown
): value is NotificationSyncPayload {
  if (!value || typeof value !== "object") return false;
  const v = value as NotificationSyncPayload;
  return (
    typeof v.unreadCount === "number" &&
    Array.isArray(v.items) &&
    typeof v.at === "string"
  );
}
