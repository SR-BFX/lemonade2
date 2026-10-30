import { getPrisma } from "./prisma";

export async function consumeRate(userId: string, action: string, limit: number, windowMs: number): Promise<boolean> {
  const prisma = getPrisma();
  const windowKey = String(Math.floor(Date.now() / windowMs));
  const bucket = await prisma.rateLimitBucket.upsert({
    where: { userId_action_windowKey: { userId, action, windowKey } },
    create: { userId, action, windowKey, count: 1 },
    update: { count: { increment: 1 } },
  });
  if (bucket.count > limit) {
    await prisma.rateLimitBucket.update({ where: { id: bucket.id }, data: { count: { decrement: 1 } } });
    return false;
  }
  return true;
}

export const DAY_MS = 24 * 60 * 60 * 1000;
export const HOUR_MS = 60 * 60 * 1000;
