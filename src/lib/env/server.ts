import "server-only";

import { z } from "zod";

import { getPublicEnvironment } from "@/lib/env/public";

const serverEnvironmentSchema = z.object({
  SUPABASE_SECRET_KEY: z.string().trim().min(1),
});

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema> &
  ReturnType<typeof getPublicEnvironment>;

export function hasServerSupabaseEnvironment(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
      process.env.SUPABASE_SECRET_KEY,
  );
}

export function getServerEnvironment(): ServerEnvironment {
  return {
    ...getPublicEnvironment(),
    ...serverEnvironmentSchema.parse({
      SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    }),
  };
}
