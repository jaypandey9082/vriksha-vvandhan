import { writeFile } from "node:fs/promises";
import path from "node:path";

import { generateCertificate } from "@/lib/certificates/generate-certificate.server";

async function main() {
  const outputPath = path.resolve(process.argv[2] ?? "/private/tmp/vriksha-certificate-preview.pdf");
  const result = await generateCertificate({
    displayName: process.argv[3] ?? "Jay Pandey",
    guardianNumber: 427,
    approvedAt: "2026-08-06T20:45:00.000Z",
  });
  await writeFile(outputPath, result.bytes);
  console.log(JSON.stringify({ outputPath, byteLength: result.byteLength, sha256: result.sha256, templateVersion: result.templateVersion }));
}

void main();
