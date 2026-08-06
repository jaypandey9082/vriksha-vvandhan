import "server-only";

import { getPublicEnvironment } from "@/lib/env/public";

function originFromForwardedHeaders(request: Request): string | null {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return null;

  const protocol = request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol.slice(0, -1);
  try {
    return new URL(`${protocol}://${host}`).origin;
  } catch {
    return null;
  }
}

export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  const allowed = new Set<string>([new URL(request.url).origin]);
  const forwardedOrigin = originFromForwardedHeaders(request);
  if (forwardedOrigin) allowed.add(forwardedOrigin);

  try {
    allowed.add(new URL(getPublicEnvironment().NEXT_PUBLIC_SITE_URL).origin);
  } catch {
    // The request and forwarded origins still provide a fail-closed local boundary.
  }

  try {
    return allowed.has(new URL(origin).origin);
  } catch {
    return false;
  }
}

export function acceptsSmallJson(request: Request, maximumBytes = 16_384): boolean {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) return false;

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  return Number.isFinite(declaredLength) && declaredLength <= maximumBytes;
}

