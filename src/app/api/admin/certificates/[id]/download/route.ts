import { z } from "zod";

import { requireRole } from "@/lib/auth/dal";
import { ForbiddenError, UnauthenticatedError } from "@/lib/auth/errors";
import { createCertificateDownloadUrl } from "@/lib/certificates/process-certificate.server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const noStoreHeaders = { "Cache-Control": "private, no-store, max-age=0" };

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    await requireRole("admin");
    const id = z.uuid().parse((await params).id);
    const result = await (await createServerSupabaseClient()).from("certificates").select("object_path,status").eq("id", id).maybeSingle();
    if (result.error || result.data?.status !== "generated" || !result.data.object_path) {
      return Response.json({ error: "not_found" }, { status: 404, headers: noStoreHeaders });
    }
    const signedUrl = await createCertificateDownloadUrl(result.data.object_path, 120);
    return new Response(null, { status: 302, headers: { ...noStoreHeaders, Location: signedUrl, "X-Content-Type-Options": "nosniff" } });
  } catch (error) {
    if (error instanceof UnauthenticatedError) return Response.json({ error: "unauthenticated" }, { status: 401, headers: noStoreHeaders });
    if (error instanceof ForbiddenError) return Response.json({ error: "forbidden" }, { status: 403, headers: noStoreHeaders });
    if (error instanceof z.ZodError) return Response.json({ error: "invalid_request" }, { status: 400, headers: noStoreHeaders });
    return Response.json({ error: "temporarily_unavailable" }, { status: 503, headers: noStoreHeaders });
  }
}
