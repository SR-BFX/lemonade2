import { AVATARS } from "./catalog";
import { messageProblem } from "./filter";
import { discoverableClassmates, romanticAllowed } from "./eligibility";
import { getPrisma } from "./prisma";
import { err, ok, type Result } from "./result";
import { inviteCode } from "./tokens";

const HANDLE = /^[a-z0-9_]{3,20}$/;
const NAME = /^[\p{L}][\p{L}\s'.-]{1,38}$/u;

export async function saveProfile(input: {
  userId: string;
  displayName: string;
  handle: string;
  grade: number;
  avatarEmoji: string;
  bio: string;
  traits: string;
  clubs: string;
  directoryOptIn: boolean;
  autopilotOptIn: boolean;
  memoryOptIn: boolean;
}): Promise<Result<{ handle: string }>> {
  const displayName = input.displayName.trim().replace(/\s+/g, " ");
  const handle = input.handle.trim().toLowerCase();
  if (!NAME.test(displayName)) return err("Use your name, 2–40 letters.");
  if (!HANDLE.test(handle)) return err("Handles are 3–20 characters: letters, numbers, and underscores.");
  if (![9, 10, 11, 12].includes(input.grade)) return err("Pick a grade from 9 to 12.");
  if (!AVATARS.includes(input.avatarEmoji)) return err("Pick an avatar from the list.");
  for (const field of [input.bio, input.traits, input.clubs]) {
    const problem = messageProblem(field, 160);
    if (problem) return err(problem);
  }
  const prisma = getPrisma();
  const taken = await prisma.user.findFirst({ where: { handle, NOT: { id: input.userId } } });
  if (taken) return err("That handle is taken.");
  const user = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!user) return err("Account not found.");

  await prisma.user.update({
    where: { id: input.userId },
    data: {
      displayName,
      handle,
      grade: input.grade,
      avatarEmoji: input.avatarEmoji,
      bio: input.bio.trim(),
      traits: input.traits.trim(),
      clubs: input.clubs.trim(),
      directoryOptIn: input.directoryOptIn,
      autopilotOptIn: input.autopilotOptIn,
      memoryOptIn: input.memoryOptIn,
      onboardingStep: user.onboardingStep === "done" ? "done" : "people",
    },
  });
  const existingInvite = await prisma.invite.findFirst({ where: { inviterId: input.userId } });
  if (!existingInvite) {
    await prisma.invite.create({
      data: { code: inviteCode(), inviterId: input.userId, schoolId: user.schoolId },
    });
  }
  return ok({ handle });
}

export async function saveCircle(input: {
  userId: string;
  friendIds: string[];
  crushIds: string[];
  finishOnboarding?: boolean;
}): Promise<Result<{ friends: number; crushes: number }>> {
  const friendIds = [...new Set(input.friendIds)].filter((id) => id !== input.userId);
  const crushIds = [...new Set(input.crushIds)].filter((id) => id !== input.userId);
  if (friendIds.length > 7) return err("Choose up to 7 friends.");
  if (crushIds.length > 3) return err("Choose up to 3 crushes.");
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!user) return err("Account not found.");
  if (crushIds.length && !romanticAllowed(user)) {
    return err("Crushes are available at 16+. You can still pick friends.");
  }
  const allowed = new Set((await discoverableClassmates(input.userId)).map((mate) => mate.id));
  for (const id of [...friendIds, ...crushIds]) {
    if (!allowed.has(id)) return err("You can only choose classmates who have joined and opted in.");
  }
  await prisma.$transaction(async (tx) => {
    await tx.friendship.deleteMany({ where: { userId: input.userId } });
    await tx.crush.deleteMany({ where: { userId: input.userId } });
    if (friendIds.length) {
      await tx.friendship.createMany({ data: friendIds.map((friendId) => ({ userId: input.userId, friendId })) });
    }
    if (crushIds.length) {
      await tx.crush.createMany({ data: crushIds.map((crushId) => ({ userId: input.userId, crushId })) });
    }
    if (input.finishOnboarding) {
      await tx.user.update({ where: { id: input.userId }, data: { onboardingStep: "done" } });
    }
  });
  return ok({ friends: friendIds.length, crushes: crushIds.length });
}

export async function updateSettings(input: {
  userId: string;
  directoryOptIn: boolean;
  allowAnonymous: boolean;
  autopilotOptIn: boolean;
  memoryOptIn: boolean;
  sleepStartHour: number;
  sleepEndHour: number;
  dailySpendCap: number | null;
}): Promise<Result<{ saved: true }>> {
  if (input.sleepStartHour < 0 || input.sleepStartHour > 23 || input.sleepEndHour < 0 || input.sleepEndHour > 23) {
    return err("Sleep hours need to be between 0 and 23.");
  }
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!user) return err("Account not found.");
  const { isUnder16 } = await import("./age");
  let cap = input.dailySpendCap;
  if (isUnder16(user.dateOfBirth)) {
    if (cap === null || cap < 0 || cap > 80) return err("Under 16, set a daily spend cap from 0 to 80.");
  } else if (cap !== null && (cap < 0 || cap > 5000)) {
    return err("Spend cap looks off. Use 0–5000, or leave it unlimited.");
  }
  await prisma.user.update({
    where: { id: input.userId },
    data: {
      directoryOptIn: input.directoryOptIn,
      allowAnonymous: input.allowAnonymous,
      autopilotOptIn: input.autopilotOptIn,
      memoryOptIn: input.memoryOptIn,
      sleepStartHour: input.sleepStartHour,
      sleepEndHour: input.sleepEndHour,
      dailySpendCap: cap,
    },
  });
  return ok({ saved: true });
}
