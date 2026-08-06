export function safeInternalDestination(value: unknown, fallback = "/admin"): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return fallback;
  try {
    const url = new URL(value, "http://internal.local");
    return url.origin === "http://internal.local" && url.pathname.startsWith("/admin")
      ? `${url.pathname}${url.search}`
      : fallback;
  } catch {
    return fallback;
  }
}
