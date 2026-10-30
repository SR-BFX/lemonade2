import { getPrisma } from "./prisma";
import { err, ok, type Result } from "./result";

export async function exportAccount(userId: string) {
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  const [memories, friends, crushes, giftsSent, giftsReceived, polls, votes, comments, events, blocks, reports, purchases, boosts] =
    await Promise.all([
      prisma.avatarMemory.findMany({ where: { userId } }),
      prisma.friendship.findMany({ where: { userId } }),
      prisma.crush.findMany({ where: { userId } }),
      prisma.giftSend.findMany({ where: { fromId: userId } }),
      prisma.giftSend.findMany({ where: { toId: userId } }),
      prisma.poll.findMany({ where: { authorId: userId }, include: { options: true } }),
      prisma.pollVote.findMany({ where: { userId } }),
      prisma.pollComment.findMany({ where: { userId } }),
      prisma.feedEvent.findMany({ where: { userId }, include: { people: true } }),
      prisma.block.findMany({ where: { blockerId: userId } }),
      prisma.report.findMany({ where: { reporterId: userId } }),
      prisma.purchase.findMany({ where: { userId } }),
      prisma.profileBoost.findMany({ where: { userId } }),
    ]);
  const { ...profile } = user;
  return {
    exportedAt: new Date().toISOString(),
    profile,
    memories,
    friends,
    crushes,
    giftsSent,
    giftsReceived,
    polls,
    votes,
    comments,
    events,
    blocks,
    reports,
    purchases,
    boosts,
    note: "Avatar memory is the notes Lemonade stored from your choices. It is not used unless memory is turned on.",
  };
}

export async function deleteAccount(userId: string): Promise<Result<{ deleted: true }>> {
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return err("Account not found.");
  await prisma.$transaction(async (tx) => {
    const polls = await tx.poll.findMany({ where: { authorId: userId }, select: { id: true } });
    const pollIds = polls.map((poll) => poll.id);
    await tx.pollVote.deleteMany({ where: { OR: [{ userId }, { pollId: { in: pollIds } }] } });
    await tx.pollComment.deleteMany({ where: { OR: [{ userId }, { pollId: { in: pollIds } }] } });
    await tx.pollOption.deleteMany({ where: { OR: [{ userId }, { pollId: { in: pollIds } }] } });
    await tx.poll.deleteMany({ where: { authorId: userId } });
    await tx.giftSend.deleteMany({ where: { OR: [{ fromId: userId }, { toId: userId }] } });
    const mentioned = await tx.feedEvent.findMany({
      where: { people: { some: { userId } }, NOT: { userId } },
      select: { id: true },
    });
    if (mentioned.length) {
      await tx.feedEvent.deleteMany({ where: { id: { in: mentioned.map((row) => row.id) } } });
    }
    await tx.emailMessage.deleteMany({ where: { to: user.email } });
    if (user.parentEmail) await tx.emailMessage.deleteMany({ where: { to: user.parentEmail } });
    await tx.user.delete({ where: { id: userId } });
  });
  return ok({ deleted: true });
}
