import { ZodError } from "zod";

import { jsonApiError } from "@/lib/submissions/api-errors";
import { acceptsSmallJson, isSameOriginRequest } from "@/lib/submissions/origin.server";
import {
  finalizeSubmissionRequestSchema,
  type FinalizeSubmissionRequest,
} from "@/lib/submissions/schemas";
import {
  finalizePublicSubmission,
  SubmissionServiceError,
} from "@/lib/submissions/service.server";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  if (!isSameOriginRequest(request) || !acceptsSmallJson(request)) {
    return jsonApiError("invalid_request", 400);
  }

  let input: FinalizeSubmissionRequest;
  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > 8_192) {
      return jsonApiError("invalid_request", 413);
    }
    input = finalizeSubmissionRequestSchema.parse(JSON.parse(rawBody));
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      return jsonApiError("invalid_request", 400);
    }
    return jsonApiError("temporarily_unavailable", 503);
  }

  try {
    return Response.json(await finalizePublicSubmission(input), {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof SubmissionServiceError) {
      const status =
        error.code === "draft_expired" ? 410 :
          error.code === "invalid_draft" ? 404 :
            error.code === "invalid_image" ? 422 :
              error.code === "already_submitted" ? 409 : 503;
      return jsonApiError(error.code, status);
    }
    return jsonApiError("temporarily_unavailable", 503);
  }
}
