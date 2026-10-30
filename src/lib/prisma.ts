import path from "node:path";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function resolveSqliteUrl() {
  if (process.env.VITEST || process.env.NODE_ENV === "test") {
    return `file:${path.resolve(process.cwd(), "prisma/test.db")}`;
  }
  const raw = process.env.DATABASE_URL ?? "file:./dev.db";
  if (!raw.startsWith("file:")) return raw;
  const filePath = raw.slice("file:".length);
  if (filePath.startsWith("//") || path.isAbsolute(filePath)) return raw;
  return `file:${path.resolve(process.cwd(), "prisma", filePath)}`;
}

export function getPrisma() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      datasources: { db: { url: resolveSqliteUrl() } },
    });
  }
  return globalForPrisma.prisma;
}

export type Db = ReturnType<typeof getPrisma>;
