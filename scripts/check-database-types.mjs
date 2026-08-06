import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const committedPath = resolve("src/lib/supabase/database.types.ts");
const temporaryPath = resolve(".tmp/database.types.generated.ts");

const linkedPostgrestMetadata =
  /  \/\/ Allows to automatically instantiate createClient with right options\n  \/\/ instead of createClient<Database, \{ PostgrestVersion: 'XX' \}>\(URL, KEY\)\n  __InternalSupabase: \{\n    PostgrestVersion: "[^"]+"\n  \}\n/;

function normalizeServiceMetadata(types) {
  const withoutLinkedServiceVersion = types.replace(linkedPostgrestMetadata, "");

  return `${withoutLinkedServiceVersion.replace(/\n+$/, "")}\n`;
}

function formatFirstDifference(committed, generated) {
  const committedLines = committed.split("\n");
  const generatedLines = generated.split("\n");
  const longest = Math.max(committedLines.length, generatedLines.length);
  const firstDifference = Array.from({ length: longest }, (_, index) => index).find(
    (index) => committedLines[index] !== generatedLines[index],
  );

  if (firstDifference === undefined) {
    return "Generated files differ at the byte level but not by text line.\n";
  }

  const start = Math.max(0, firstDifference - 3);
  const end = Math.min(longest, firstDifference + 12);
  const context = [];

  for (let index = start; index < end; index += 1) {
    if (committedLines[index] === generatedLines[index]) {
      context.push(`  ${index + 1}: ${committedLines[index] ?? "<missing>"}`);
      continue;
    }

    context.push(`- ${index + 1}: ${committedLines[index] ?? "<missing>"}`);
    context.push(`+ ${index + 1}: ${generatedLines[index] ?? "<missing>"}`);
  }

  return `First generated-type difference at line ${firstDifference + 1}:\n${context.join("\n")}\n`;
}

mkdirSync(dirname(temporaryPath), { recursive: true });

try {
  const result = spawnSync(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["supabase", "gen", "types", "--local", "--schema", "public,private"],
    { encoding: "utf8" },
  );

  if (result.status !== 0) {
    process.stderr.write(
      result.stderr || result.stdout || "Supabase type generation failed.\n",
    );
    process.exitCode = result.status ?? 1;
  } else {
    writeFileSync(temporaryPath, result.stdout);
    const committed = normalizeServiceMetadata(
      existsSync(committedPath) ? readFileSync(committedPath, "utf8") : "",
    );
    const generated = normalizeServiceMetadata(
      readFileSync(temporaryPath, "utf8"),
    );

    if (committed !== generated) {
      process.stderr.write(
        "Committed Supabase database types are stale. Run npm run db:types after applying migrations.\n",
      );
      process.stderr.write(formatFirstDifference(committed, generated));
      process.exitCode = 1;
    }
  }
} finally {
  rmSync(temporaryPath, { force: true });
}
