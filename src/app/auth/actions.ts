"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { z } from "zod";

import { resolveStaffSession, type StaffDalClient } from "@/lib/auth/dal";
import { safeInternalDestination } from "@/lib/auth/redirects";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isStaffE2EAdapterEnabled, STAFF_E2E_COOKIE } from "@/lib/testing/staff-adapter";

const loginSchema = z.object({ email: z.email(), password: z.string().min(8).max(256) });

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  const next = safeInternalDestination(formData.get("next"));
  if (!parsed.success) redirect(`/auth/login?error=1&next=${encodeURIComponent(next)}`);
  const client = await createServerSupabaseClient();
  const { error } = await client.auth.signInWithPassword(parsed.data);
  if (error) redirect(`/auth/login?error=1&next=${encodeURIComponent(next)}`);
  const resolution = await resolveStaffSession(client as unknown as StaffDalClient);
  if (resolution.kind !== "staff") {
    await client.auth.signOut({ scope: "local" });
    redirect(`/auth/login?error=1&next=${encodeURIComponent(next)}`);
  }
  redirect(next);
}

export async function logoutAction() {
  if (isStaffE2EAdapterEnabled()) {
    (await cookies()).delete(STAFF_E2E_COOKIE);
    redirect("/auth/login");
  }
  const client = await createServerSupabaseClient();
  await client.auth.signOut({ scope: "local" });
  redirect("/auth/login");
}
