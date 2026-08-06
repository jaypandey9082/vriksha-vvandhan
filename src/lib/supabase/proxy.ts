import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { hasPublicSupabaseEnvironment } from "@/lib/env/public";

export async function updateSupabaseSession(request: NextRequest) {
  const testRole = request.cookies.get("vriksha-e2e-staff-role")?.value;
  if (process.env.NODE_ENV !== "production" && process.env.PLAYWRIGHT_STAFF_ADAPTER === "1" && request.nextUrl.pathname.startsWith("/admin") && (testRole === "admin" || testRole === "reviewer")) {
    return NextResponse.next({ request });
  }
  if (!hasPublicSupabaseEnvironment()) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
          Object.entries(headers).forEach(([name, value]) => {
            response.headers.set(name, value);
          });
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();

  if (!data?.claims && request.nextUrl.pathname.startsWith("/admin")) {
    const signInUrl = request.nextUrl.clone();
    signInUrl.pathname = "/auth/login";
    signInUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  return response;
}
