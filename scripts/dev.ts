import { execSync, spawn } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";

if (!existsSync(".env")) {
  writeFileSync(
    ".env",
    `DATABASE_URL="file:./dev.db"\nCRON_SECRET="dev-cron-secret"\nNEXT_PUBLIC_APP_URL="http://localhost:3000"\n`,
  );
  console.log("Wrote .env");
}

execSync("npx prisma db push --skip-generate", { stdio: "inherit" });
execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });

const child = spawn("npx", ["next", "dev"], { stdio: "inherit", env: process.env });
child.on("exit", (code) => process.exit(code ?? 0));
process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));
