import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const committedPath = resolve("src/lib/supabase/database.types.ts");
const temporaryPath = resolve(".tmp/database.types.generated.ts");

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
    const committed = existsSync(committedPath)
      ? readFileSync(committedPath, "utf8")
      : "";
    const generated = readFileSync(temporaryPath, "utf8");

    if (committed !== generated) {
      process.stderr.write(
        "Committed Supabase database types are stale. Run npm run db:types after applying migrations.\n",
      );
      process.exitCode = 1;
    }
  }
} finally {
  rmSync(temporaryPath, { force: true });
}
