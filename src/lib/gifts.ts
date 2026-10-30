import { giftByKey } from "./catalog";
import { effectiveSpendCap, spentSoFar } from "./economy";
import { interactionBlockReason, romanticAllowed } from "./eligibility";
import { messageProblem } from "./filter";
import { getPrisma } from "./prisma";
import { DAY_MS, consumeRate } from "./rate-limit";
import { err, ok, type Result } from "./result";
import { awardPoints, bumpStat } from "./social";
import { dayKey } from "./age";

export async function sendGift(input: {
  fromId: string;
  toId: string;
  giftKey: string;
  anonymous: boolean;
  message: string;
  now?: Date;
}): Promise<Result<{ giftId: string }>> {
  const now = input.now ?? new Date();
  const gift = giftByKey(input.giftKey);
  if (!gift) return err("That gift isn't in the catalogue.");
  const message = input.message.trim();
  const problem = messageProblem(message);
  if (problem) return err(problem);
  const blocked = await interactionBlockReason(input.fromId, input.toId, now);
  if (blocked) return err(blocked);
  const prisma = getPrisma();
  const [from, to] = await Promise.all([
    prisma.user.findUnique({ where: { id: input.fromId } }),
    prisma.user.findUnique({ where: { id: input.toId } }),
  ]);
  if (!from || !to) return err("That student hasn't joined Lemonade.");
  if (gift.minAge >= 16 && !romanticAllowed(from)) {
    return err("Romantic gifts, including Kiss, are for students 16 and older. Try a High Five, Hug, or a treat.");
  }
  if (input.anonymous && !to.allowAnonymous) {
    return err("This student isn't accepting anonymous gifts. You can still send one with your name.");
  }
  const cap = effectiveSpendCap(from, now);
  const spent = spentSoFar(from, now);
  if (cap !== null && spent + gift.gems > cap) {
    return err(`Daily spend cap is ${cap} gems. You've used ${spent}. You can lower or raise it (up to 80) in Settings.`);
  }
  if (from.gems < gift.gems) return err("Not enough gems.");
  const allowed = await consumeRate(from.id, input.anonymous ? "anon-gift" : "gift", input.anonymous ? 3 : 12, DAY_MS);
  if (!allowed) return err(input.anonymous ? "Anonymous gift limit reached for today." : "Gift limit reached for today.");

  try {
    const giftId = await prisma.$transaction(async (tx) => {
      const debit = await tx.user.updateMany({
        where: { id: from.id, gems: { gte: gift.gems } },
        data: { gems: { decrement: gift.gems }, spentToday: spent + gift.gems, spendDay: dayKey(now) },
      });
      if (debit.count !== 1) throw new Error("Not enough gems.");
      const senderEvent = await tx.feedEvent.create({
        data: {
          userId: from.id,
          emoji: gift.emoji,
          title: input.anonymous ? `You sent a secret ${gift.name}` : `You sent ${to.displayName} a ${gift.name}`,
          body: message || `A ${gift.name} is on its way.`,
          choices: "[]",
          status: "resolved",
          source: "gift",
          romantic: gift.minAge >= 16,
        },
      });
      const recipientEvent = await tx.feedEvent.create({
        data: {
          userId: to.id,
          emoji: gift.emoji,
          title: input.anonymous ? `A secret admirer sent you a ${gift.name}` : `${from.displayName} sent you a ${gift.name}`,
          body: message || "No note attached.",
          choices: "[]",
          status: "resolved",
          source: "gift",
          romantic: gift.minAge >= 16,
          ...(input.anonymous ? {} : { people: { create: [{ userId: from.id }] } }),
        },
      });
      const row = await tx.giftSend.create({
        data: {
          fromId: from.id,
          toId: to.id,
          giftKey: gift.key,
          anonymous: input.anonymous,
          message,
          gems: gift.gems,
          senderEventId: senderEvent.id,
          recipientEventId: recipientEvent.id,
        },
      });
      await awardPoints(from.id, 2, `Sent ${gift.name}`, tx, now);
      await awardPoints(to.id, 3, `Received ${gift.name}`, tx, now);
      if (!input.anonymous) {
        await bumpStat(from.id, to.id, { friendship: 10 }, tx);
        await bumpStat(to.id, from.id, { friendship: 6 }, tx);
      }
      return row.id;
    });
    return ok({ giftId });
  } catch (error) {
    const text = error instanceof Error ? error.message : "Couldn't send that gift.";
    return err(text);
  }
}

export function giftView<T extends { anonymous: boolean; fromId: string; toId: string }>(
  gift: T,
  viewerId: string,
  viewerIsMod: boolean,
): T & { showSender: boolean } {
  const showSender = viewerIsMod || !gift.anonymous || gift.fromId === viewerId;
  return { ...gift, showSender };
}
