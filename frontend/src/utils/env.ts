/**
 * Browser API origin.
 * In local `next dev`, use a same-origin path so phones on Wi‑Fi do not call
 * `localhost:5000` (that host is the phone) or hit CORS/firewall on :5000.
 * Next.js rewrites `/api/v1` to the backend on this machine.
 */
export function getPublicApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

  if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
    return "";
  }

  return configured || "http://localhost:5000";
}

export function getApiV1BaseUrl(): string {
  const origin = getPublicApiBaseUrl();
  return origin ? `${origin}/api/v1` : "/api/v1";
}
