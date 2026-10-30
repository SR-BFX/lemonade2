import { ageFromDob, dayKey, isUnder16 } from "./age";
import { boostByTier, skuById } from "./catalog";
import { getPaymentProvider } from "./payments";
import { getPrisma } from "./prisma";
import { err, ok, type Result } from "./result";
import type { User } from "@prisma/client";

export function effectiveSpendCap(user: Pick<User, "dateOfBirth" | "dailySpendCap">, now = new Date()): number | null {
  if (isUnder16(user.dateOfBirth, now)) return user.dailySpendCap ?? 40;
  return user.dailySpendCap;
}

export function spentSoFar(user: Pick<User, "spentToday" | "spendDay">, now = new Date()): number {
  return user.spendDay === dayKey(now) ? user.spentToday : 0;
}

export async function purchaseSku(userId: string, skuId: string, now = new Date()): Promise<Result<{ ref: string }>> {
  const sku = skuById(skuId);
  if (!sku) return err("That item isn't in the store.");
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.deletedAt || user.suspendedAt) return err("Account isn't active.");
  if (isUnder16(user.dateOfBirth, now)) {
    const start = new Date(dayKey(now) + "T00:00:00.000Z");
    const bought = await prisma.purchase.count({ where: { userId, createdAt: { gte: start }, status: "paid" } });
    if (bought >= 1) return err("Under 16, the test store allows one purchase a day. No rush.");
  }
  const provider = getPaymentProvider();
  const charge = await provider.charge({ userId, sku: sku.sku, amountCents: sku.amountCents });
  if (!charge.ok) return err(charge.error);
  await prisma.$transaction(async (tx) => {
    await tx.purchase.create({
      data: {
        userId,
        sku: sku.sku,
        amountCents: sku.amountCents,
        provider: provider.name,
        providerRef: charge.ref,
        status: "paid",
      },
    });
    await tx.user.update({
      where: { id: userId },
      data: {
        gems: { increment: sku.gems },
        stars: { increment: sku.stars },
      },
    });
  });
  return ok({ ref: charge.ref });
}

export async function buyBoost(userId: string, tier: string, now = new Date()): Promise<Result<{ until: Date }>> {
  const boost = boostByTier(tier);
  if (!boost) return err("Pick a boost.");
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.deletedAt || user.suspendedAt) return err("Account isn't active.");
  if (!user.directoryOptIn) return err("Turn on directory visibility before boosting. A boost only reaches people who can already find opted-in students.");
  const cap = effectiveSpendCap(user, now);
  const spent = spentSoFar(user, now);
  if (cap !== null && spent + boost.stars > cap) {
    return err(`Daily spend cap is ${cap}. You've used ${spent}. Boosts count toward it. Adjust the cap in Settings if you're under the maximum.`);
  }
  if (user.stars < boost.stars) return err("Not enough stars. Earn them by showing up, or add a test pack in the store.");
  const endsAt = new Date(now.getTime() + boost.hours * 60 * 60 * 1000);
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        stars: { decrement: boost.stars },
        spentToday: spent + boost.stars,
        spendDay: dayKey(now),
      },
    });
    await tx.profileBoost.create({
      data: { userId, tier: boost.tier, stars: boost.stars, startsAt: now, endsAt },
    });
  });
  return ok({ until: endsAt });
}

export function ageOf(user: Pick<User, "dateOfBirth">, now = new Date()): number {
  return ageFromDob(user.dateOfBirth, now);
}
