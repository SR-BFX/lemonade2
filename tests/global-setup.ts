import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";

export default function setup() {
  const file = path.resolve("prisma/test.db");
  rmSync(file, { force: true });
  rmSync(`${file}-journal`, { force: true });
  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: `file:${file}` },
  });
}
