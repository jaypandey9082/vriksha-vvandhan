import { afterEach, describe, expect, it, vi } from "vitest";

import { getPublicEnvironment } from "@/lib/env/public";
import { getServerEnvironment } from "@/lib/env/server";

const originalEnvironment = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnvironment };
  vi.unstubAllEnvs();
});

describe("environment validation", () => {
  it("validates public values lazily and applies the local site default", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
    delete process.env.NEXT_PUBLIC_SITE_URL;

    expect(getPublicEnvironment()).toEqual({
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
    });
  });

  it("rejects an incomplete public Supabase environment only when read", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    expect(() => getPublicEnvironment()).toThrow();
  });

  it("keeps the secret in server-only validation", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
    vi.stubEnv("SUPABASE_SECRET_KEY", "sb_secret_test");

    expect(getServerEnvironment().SUPABASE_SECRET_KEY).toBe("sb_secret_test");
  });

  it("rejects a missing server secret", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
    delete process.env.SUPABASE_SECRET_KEY;
    expect(() => getServerEnvironment()).toThrow();
  });
});
