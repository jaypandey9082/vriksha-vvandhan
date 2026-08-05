import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getServerEnvironment } from "@/lib/env/server";
import type { Database } from "@/lib/supabase/database.types";

let serviceClient: SupabaseClient<Database> | undefined;

/**
 * Trusted server client. The secret key bypasses RLS, so this module must never
 * be imported by a Client Component or used for caller-authorized operations
 * without a separate DAL permission check.
 */
export function getServiceSupabaseClient(): SupabaseClient<Database> {
  if (serviceClient) {
    return serviceClient;
  }

  const environment = getServerEnvironment();
  serviceClient = createClient<Database>(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.SUPABASE_SECRET_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );

  return serviceClient;
}
