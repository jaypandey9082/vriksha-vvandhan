import { describe, expect, it } from "vitest";

import {
  buildCertificatePath,
  buildOriginalPath,
  buildPublishedCardPath,
  buildPublishedFullPath,
  parseStoredOriginalPath,
} from "@/lib/storage/paths";

const submissionId = "00000000-0000-4000-8000-000000000001";

describe("immutable Storage paths", () => {
  it("builds only the approved private and public forms", () => {
    expect(buildOriginalPath(submissionId, "JPEG")).toBe(
      `${submissionId}/original.jpeg`,
    );
    expect(buildPublishedCardPath(417, "v1")).toBe("card/417-v1.webp");
    expect(buildPublishedFullPath(417, "v1")).toBe("full/417-v1.webp");
    expect(buildCertificatePath(submissionId, 417, "v1")).toBe(
      `${submissionId}/vriksha-guardian-417-v1.pdf`,
    );
  });

  it("rejects traversal, folders, invalid identifiers, and unsafe versions", () => {
    expect(() => buildOriginalPath("../person", "jpg")).toThrow();
    expect(() => buildOriginalPath(submissionId, "jpg/../../png")).toThrow();
    expect(() => buildPublishedCardPath(0, "v1")).toThrow();
    expect(() => buildPublishedFullPath(1, "../v2")).toThrow();
    expect(() => parseStoredOriginalPath(`${submissionId}/../secret.jpg`)).toThrow();
  });

  it("accepts only a stored private-original path", () => {
    expect(parseStoredOriginalPath(`${submissionId}/original.webp`)).toBe(
      `${submissionId}/original.webp`,
    );
    expect(() => parseStoredOriginalPath("card/417-v1.webp")).toThrow();
  });
});
