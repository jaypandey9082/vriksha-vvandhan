import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getSigned: vi.fn() }));

vi.mock("@/lib/moderation/data.server", () => ({
  getSignedQueueThumbnails: mocks.getSigned,
}));

import { POST } from "@/app/api/admin/review-thumbnails/route";

const id = "00000000-0000-4000-8000-000000000001";

beforeEach(() => vi.clearAllMocks());

describe("authenticated review-thumbnail batch endpoint", () => {
  it("returns only an opaque ID-to-signed-URL map with private no-store caching", async () => {
    mocks.getSigned.mockResolvedValue(new Map([[id, "https://private.test/token"]]));
    const response = await POST(new Request("http://localhost/api/admin/review-thumbnails", {
      method: "POST",
      body: JSON.stringify({ submissionIds: [id] }),
    }));

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store, max-age=0");
    expect(await response.json()).toEqual({ thumbnails: { [id]: "https://private.test/token" } });
    expect(mocks.getSigned).toHaveBeenCalledWith([id]);
  });

  it("rejects invalid or oversized batches before signing", async () => {
    const response = await POST(new Request("http://localhost/api/admin/review-thumbnails", {
      method: "POST",
      body: JSON.stringify({ submissionIds: Array(26).fill(id) }),
    }));
    expect(response.status).toBe(400);
    expect(mocks.getSigned).not.toHaveBeenCalled();
  });

  it("does not leak signing failures", async () => {
    mocks.getSigned.mockRejectedValue(new Error("private storage detail"));
    const response = await POST(new Request("http://localhost/api/admin/review-thumbnails", {
      method: "POST",
      body: JSON.stringify({ submissionIds: [id] }),
    }));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "temporarily_unavailable" });
  });
});
