import { getPrisma } from "./prisma";
import { err, ok, type Result } from "./result";

export async function fileReport(input: {
  reporterId: string;
  targetType: string;
  targetId: string;
  reason: string;
}): Promise<Result<{ id: string }>> {
  if (!["gift", "user", "poll", "comment"].includes(input.targetType)) return err("Unknown report type.");
  const reason = input.reason.trim();
  if (reason.length < 3 || reason.length > 300) return err("Add a short reason.");
  const prisma = getPrisma();
  const report = await prisma.report.create({
    data: {
      reporterId: input.reporterId,
      targetType: input.targetType,
      targetId: input.targetId,
      reason,
    },
  });
  return ok({ id: report.id });
}

export async function moderationQueue() {
  const prisma = getPrisma();
  const reports = await prisma.report.findMany({
    where: { status: "open" },
    orderBy: { createdAt: "desc" },
    include: { reporter: true },
  });
  const detailed = [];
  for (const report of reports) {
    let sender: { id: string; displayName: string | null; email: string } | null = null;
    let summary = report.targetId;
    if (report.targetType === "gift") {
      const gift = await prisma.giftSend.findUnique({
        where: { id: report.targetId },
        include: { from: true, to: true },
      });
      if (gift) {
        sender = { id: gift.from.id, displayName: gift.from.displayName, email: gift.from.email };
        summary = `${gift.anonymous ? "Anonymous" : "Named"} ${gift.giftKey} to ${gift.to.displayName} (${gift.to.email})`;
      }
    } else if (report.targetType === "user") {
      const user = await prisma.user.findUnique({ where: { id: report.targetId } });
      if (user) {
        sender = { id: user.id, displayName: user.displayName, email: user.email };
        summary = user.displayName || user.email;
      }
    }
    detailed.push({ report, sender, summary });
  }
  return detailed;
}

export async function resolveReport(input: {
  moderatorId: string;
  reportId: string;
  action: "dismiss" | "remove" | "suspend";
}): Promise<Result<{ status: string }>> {
  const prisma = getPrisma();
  const moderator = await prisma.user.findUnique({ where: { id: input.moderatorId } });
  if (!moderator || moderator.role !== "moderator") return err("Moderators only.");
  const report = await prisma.report.findUnique({ where: { id: input.reportId } });
  if (!report || report.status !== "open") return err("That report is already closed.");
  const now = new Date();

  if (input.action === "dismiss") {
    await prisma.report.update({
      where: { id: report.id },
      data: { status: "dismissed", resolution: "No action", resolverId: moderator.id, resolvedAt: now },
    });
    return ok({ status: "dismissed" });
  }

  if (input.action === "remove" && report.targetType === "gift") {
    const gift = await prisma.giftSend.findUnique({ where: { id: report.targetId } });
    if (gift) {
      await prisma.feedEvent.deleteMany({
        where: { id: { in: [gift.recipientEventId, gift.senderEventId].filter((id): id is string => Boolean(id)) } },
      });
      await prisma.user.update({ where: { id: gift.fromId }, data: { gems: { increment: gift.gems } } });
      await prisma.giftSend.delete({ where: { id: gift.id } });
    }
  }

  if (input.action === "remove" && report.targetType === "comment") {
    await prisma.pollComment.deleteMany({ where: { id: report.targetId } });
  }

  if (input.action === "suspend") {
    const targetUserId = report.targetType === "user"
      ? report.targetId
      : report.targetType === "gift"
        ? (await prisma.giftSend.findUnique({ where: { id: report.targetId } }))?.fromId
        : report.targetType === "comment"
          ? (await prisma.pollComment.findUnique({ where: { id: report.targetId } }))?.userId
          : undefined;
    if (targetUserId) {
      await prisma.user.update({
        where: { id: targetUserId },
        data: { suspendedAt: now, autopilotOptIn: false, directoryOptIn: false },
      });
    }
  }

  await prisma.report.update({
    where: { id: report.id },
    data: { status: "actioned", resolution: input.action, resolverId: moderator.id, resolvedAt: now },
  });
  return ok({ status: "actioned" });
}

export async function blockUser(blockerId: string, blockedId: string): Promise<Result<{ blocked: true }>> {
  if (blockerId === blockedId) return err("You can't block yourself.");
  const prisma = getPrisma();
  const target = await prisma.user.findUnique({ where: { id: blockedId } });
  if (!target) return err("That student hasn't joined Lemonade.");
  await prisma.block.upsert({
    where: { blockerId_blockedId: { blockerId, blockedId } },
    create: { blockerId, blockedId },
    update: {},
  });
  await prisma.friendship.deleteMany({
    where: {
      OR: [
        { userId: blockerId, friendId: blockedId },
        { userId: blockedId, friendId: blockerId },
      ],
    },
  });
  await prisma.crush.deleteMany({
    where: {
      OR: [
        { userId: blockerId, crushId: blockedId },
        { userId: blockedId, crushId: blockerId },
      ],
    },
  });
  return ok({ blocked: true });
}

export async function unblockUser(blockerId: string, blockedId: string) {
  const prisma = getPrisma();
  await prisma.block.deleteMany({ where: { blockerId, blockedId } });
  return ok({ unblocked: true });
}
