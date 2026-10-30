import { isDiscoverable } from "./eligibility";
import { getPrisma } from "./prisma";

export type BoardPeriod = "weekly" | "monthly" | "all";

export async function leaderboard(schoolId: string, period: BoardPeriod, now = new Date()) {
  const prisma = getPrisma();
  const since = period === "weekly"
    ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    : period === "monthly"
      ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      : null;
  const events = await prisma.pointEvent.findMany({
    where: { ...(since ? { createdAt: { gte: since } } : {}), user: { schoolId } },
    include: { user: true },
  });
  const totals = new Map<string, { points: number; user: (typeof events)[number]["user"] }>();
  for (const event of events) {
    if (!isDiscoverable(event.user, now)) continue;
    const row = totals.get(event.userId) ?? { points: 0, user: event.user };
    row.points += event.points;
    totals.set(event.userId, row);
  }
  return [...totals.values()]
    .filter((row) => row.points > 0)
    .sort((a, b) => b.points - a.points || a.user.displayName!.localeCompare(b.user.displayName!));
}

export function rankOf(rows: { user: { id: string } }[], userId: string): number | null {
  const index = rows.findIndex((row) => row.user.id === userId);
  return index === -1 ? null : index + 1;
}
