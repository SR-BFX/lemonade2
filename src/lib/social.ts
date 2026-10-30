import type { Prisma } from "@prisma/client";
import { getPrisma } from "./prisma";

const INTERESTS = ["Low", "Medium", "High"] as const;
export type Interest = (typeof INTERESTS)[number];

export async function bumpStat(
  userId: string,
  otherId: string,
  delta: { friendship?: number; interest?: Interest },
  tx?: Prisma.TransactionClient,
) {
  const db = tx ?? getPrisma();
  const existing = await db.socialStat.findUnique({ where: { userId_otherId: { userId, otherId } } });
  const friendship = clamp((existing?.friendship ?? 20) + (delta.friendship ?? 0));
  const interest = delta.interest
    ? higherInterest(existing?.interest ?? "Low", delta.interest)
    : (existing?.interest ?? "Low");
  await db.socialStat.upsert({
    where: { userId_otherId: { userId, otherId } },
    create: { userId, otherId, friendship, interest },
    update: { friendship, interest },
  });
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function higherInterest(current: string, next: Interest): string {
  return INTERESTS.indexOf(next) > INTERESTS.indexOf(current as Interest) ? next : current;
}

export async function awardPoints(
  userId: string,
  points: number,
  reason: string,
  tx?: Prisma.TransactionClient,
  at?: Date,
) {
  if (!points) return;
  const db = tx ?? getPrisma();
  await db.pointEvent.create({
    data: { userId, points, reason, ...(at ? { createdAt: at } : {}) },
  });
  await db.user.update({ where: { id: userId }, data: { points: { increment: points } } });
}

export async function remember(
  userId: string,
  memoryOptIn: boolean,
  content: string | undefined,
  source: string,
  kind = "preference",
  tx?: Prisma.TransactionClient,
) {
  if (!memoryOptIn || !content?.trim()) return;
  const db = tx ?? getPrisma();
  const existing = await db.avatarMemory.findFirst({ where: { userId, content: content.trim() } });
  if (existing) return;
  await db.avatarMemory.create({ data: { userId, kind, content: content.trim(), source } });
}

export async function mutualCrushIds(userId: string): Promise<string[]> {
  const prisma = getPrisma();
  const mine = await prisma.crush.findMany({ where: { userId } });
  if (!mine.length) return [];
  const back = await prisma.crush.findMany({
    where: { crushId: userId, userId: { in: mine.map((row) => row.crushId) } },
  });
  return back.map((row) => row.userId);
}
