import "server-only";

import { createHash } from "node:crypto";

import { requestTokenSchema } from "@/lib/submissions/schemas";

export function hashPublicRequestToken(token: string): string {
  return createHash("sha256").update(requestTokenSchema.parse(token), "utf8").digest("hex");
}

