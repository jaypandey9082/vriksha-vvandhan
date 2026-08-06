import { NextResponse } from "next/server";

import { resolveStaffSession, type StaffDalClient } from "@/lib/auth/dal";
import { safeInternalDestination } from "@/lib/auth/redirects";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const destination = safeInternalDestination(url.searchParams.get("next"));
  if (!code) return NextResponse.redirect(new URL("/auth/login?error=1", url));
  const client = await createServerSupabaseClient();
  const { error } = await client.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/auth/login?error=1", url));
  const resolution = await resolveStaffSession(client as unknown as StaffDalClient);
  if (resolution.kind !== "staff") {
    await client.auth.signOut({ scope: "local" });
    return NextResponse.redirect(new URL("/auth/login?error=1", url));
  }
  return NextResponse.redirect(new URL(destination, url));
}
