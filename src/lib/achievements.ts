import { getPrisma } from "./prisma";

export async function achievementsFor(userId: string) {
  const prisma = getPrisma();
  const [user, gifts, mentions, friends] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.giftSend.count({ where: { fromId: userId } }),
    prisma.pollOption.count({ where: { userId } }),
    prisma.friendship.count({ where: { userId } }),
  ]);
  const earned: { title: string; detail: string }[] = [];
  if (friends >= 1) earned.push({ title: "Made a friend", detail: "You picked at least one classmate" });
  if (gifts >= 1) earned.push({ title: "First gift", detail: "You sent a gift" });
  if (gifts >= 5) earned.push({ title: "Generous Friend", detail: "Sent 5 or more gifts" });
  if (mentions >= 1) earned.push({ title: "In the mix", detail: "A classmate included you in a poll" });
  if (mentions >= 3) earned.push({ title: "Popular Student", detail: "Mentioned in 3 or more polls" });
  if ((user?.streak ?? 0) >= 3) earned.push({ title: "On a roll", detail: `${user?.streak} day streak` });
  if ((user?.streak ?? 0) >= 7) earned.push({ title: "Weeklong", detail: "A 7 day streak" });
  return earned;
}
