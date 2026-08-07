import { z } from "zod";

import { ForbiddenError, UnauthenticatedError } from "@/lib/auth/errors";
import { getSignedQueueThumbnails } from "@/lib/moderation/data.server";

export const runtime = "nodejs";

const requestSchema = z.object({
  submissionIds: z.array(z.uuid()).max(25),
});

const noStoreHeaders = { "Cache-Control": "private, no-store, max-age=0" };

export async function POST(request: Request): Promise<Response> {
  try {
    const input = requestSchema.parse(await request.json());
    const urls = await getSignedQueueThumbnails(input.submissionIds);
    return Response.json(
      { thumbnails: Object.fromEntries(urls) },
      { headers: noStoreHeaders },
    );
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return Response.json({ error: "unauthenticated" }, { status: 401, headers: noStoreHeaders });
    }
    if (error instanceof ForbiddenError) {
      return Response.json({ error: "forbidden" }, { status: 403, headers: noStoreHeaders });
    }
    if (error instanceof z.ZodError) {
      return Response.json({ error: "invalid_request" }, { status: 400, headers: noStoreHeaders });
    }
    return Response.json({ error: "temporarily_unavailable" }, { status: 503, headers: noStoreHeaders });
  }
}
