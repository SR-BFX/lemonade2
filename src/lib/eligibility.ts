import type { User } from "@prisma/client";
import { ageFromDob, canUseRomanticFeatures } from "./age";
import { getPrisma } from "./prisma";

export function isDiscoverable(user: Pick<
  User,
  | "emailVerifiedAt"
  | "displayName"
  | "handle"
  | "grade"
  | "deletedAt"
  | "suspendedAt"
  | "directoryOptIn"
  | "onboardingStep"
  | "dateOfBirth"
  | "parentalConsentAt"
>, now = new Date()): boolean {
  if (!user.emailVerifiedAt || !user.displayName || !user.handle || !user.grade) return false;
  if (user.deletedAt || user.suspendedAt) return false;
  if (!user.directoryOptIn || user.onboardingStep !== "done") return false;
  if (ageFromDob(user.dateOfBirth, now) < 16 && !user.parentalConsentAt) return false;
  return true;
}

export function canRunAutopilot(user: Pick<
  User,
  "autopilotOptIn" | "emailVerifiedAt" | "deletedAt" | "suspendedAt" | "displayName" | "dateOfBirth" | "parentalConsentAt"
>, now = new Date()): boolean {
  if (!user.autopilotOptIn || !user.emailVerifiedAt || !user.displayName) return false;
  if (user.deletedAt || user.suspendedAt) return false;
  if (ageFromDob(user.dateOfBirth, now) < 16 && !user.parentalConsentAt) return false;
  return true;
}

export function isAsleep(hour: number, start: number, end: number): boolean {
  if (start === end) return false;
  if (start < end) return hour >= start && hour < end;
  return hour >= start || hour < end;
}

export async function interactionBlockReason(actorId: string, targetId: string, now = new Date()): Promise<string | null> {
  if (actorId === targetId) return "You can't do that with yourself.";
  const prisma = getPrisma();
  const [actor, target] = await Promise.all([
    prisma.user.findUnique({ where: { id: actorId } }),
    prisma.user.findUnique({ where: { id: targetId } }),
  ]);
  if (!actor || actor.deletedAt) return "Your profile isn't available.";
  if (!target || target.deletedAt) return "That student hasn't joined Lemonade.";
  if (!isDiscoverable(actor, now)) return "Your profile isn't visible yet. Finish signup and any parent approval first.";
  if (!isDiscoverable(target, now)) return "That student hasn't joined or hasn't opted in.";
  if (actor.schoolId !== target.schoolId) return "You can only do this with students at your school who joined.";
  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: actorId, blockedId: targetId },
        { blockerId: targetId, blockedId: actorId },
      ],
    },
  });
  if (block) return "You can't interact with this student.";
  return null;
}

export async function countDiscoverable(schoolId: string, now = new Date()): Promise<number> {
  const prisma = getPrisma();
  const users = await prisma.user.findMany({ where: { schoolId } });
  return users.filter((user) => isDiscoverable(user, now)).length;
}

export async function discoverableClassmates(userId: string, now = new Date()) {
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return [];
  const blocks = await prisma.block.findMany({
    where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
  });
  const blocked = new Set(blocks.map((row) => (row.blockerId === userId ? row.blockedId : row.blockerId)));
  const mates = await prisma.user.findMany({ where: { schoolId: user.schoolId, id: { not: userId } } });
  return mates.filter((mate) => isDiscoverable(mate, now) && !blocked.has(mate.id));
}

export function romanticAllowed(user: Pick<User, "dateOfBirth">, now = new Date()): boolean {
  return canUseRomanticFeatures(user.dateOfBirth, now);
}
