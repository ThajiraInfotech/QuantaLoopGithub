/**
 * Local material uploads are stored as http://localhost:5000/uploads/materials/...
 * A phone on Wi‑Fi cannot load that host (localhost is the phone itself).
 * In next dev, rewrite to a same-origin path so Next proxies /uploads/materials.
 */
export function toBrowserMediaUrl(url: string): string {
  if (!url?.trim()) return url;
  if (process.env.NODE_ENV === "production") return url;

  try {
    const parsed = new URL(url);
    if (!parsed.pathname.startsWith("/uploads/")) return url;
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return url.startsWith("/uploads/") ? url : url;
  }
}
