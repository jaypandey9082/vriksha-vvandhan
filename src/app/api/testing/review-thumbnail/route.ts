import { isStaffE2EAdapterEnabled } from "@/lib/testing/staff-adapter";

export async function GET(request: Request): Promise<Response> {
  if (!isStaffE2EAdapterEnabled()) return new Response(null, { status: 404 });
  const mode = new URL(request.url).searchParams.get("mode");
  if (mode === "broken") return new Response(null, { status: 404 });
  await new Promise((resolve) => setTimeout(resolve, 250));
  return Response.redirect(new URL("/campaign/guardian-preview.webp", request.url), 307);
}
