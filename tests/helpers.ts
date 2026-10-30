import { getPrisma } from "@/lib/prisma";

export function prisma() {
  return getPrisma();
}

export async function resetDatabase() {
  const db = prisma();
  await db.feedEventPerson.deleteMany();
  await db.feedEvent.deleteMany();
  await db.pollVote.deleteMany();
  await db.pollComment.deleteMany();
  await db.pollOption.deleteMany();
  await db.poll.deleteMany();
  await db.giftSend.deleteMany();
  await db.pointEvent.deleteMany();
  await db.profileBoost.deleteMany();
  await db.purchase.deleteMany();
  await db.report.deleteMany();
  await db.block.deleteMany();
  await db.crush.deleteMany();
  await db.friendship.deleteMany();
  await db.socialStat.deleteMany();
  await db.avatarMemory.deleteMany();
  await db.rateLimitBucket.deleteMany();
  await db.invite.deleteMany();
  await db.ambassadorApplication.deleteMany();
  await db.parentalConsent.deleteMany();
  await db.session.deleteMany();
  await db.verificationCode.deleteMany();
  await db.emailMessage.deleteMany();
  await db.supportMessage.deleteMany();
  await db.schoolRequest.deleteMany();
  await db.user.deleteMany();
  await db.school.deleteMany();
}

export async function makeSchool(overrides?: { domain?: string; name?: string }) {
  return prisma().school.create({
    data: {
      name: overrides?.name ?? "Lincoln High School",
      kind: "Public",
      grades: "9-12",
      city: "Springfield",
      emailDomain: overrides?.domain ?? "lincoln.example",
      distanceMiles: 0.8,
    },
  });
}

let seq = 0;

export async function makeUser(input: {
  schoolId: string;
  email?: string;
  name?: string;
  dob?: string;
  directoryOptIn?: boolean;
  autopilotOptIn?: boolean;
  memoryOptIn?: boolean;
  parentalConsentAt?: Date | null;
  allowAnonymous?: boolean;
  gems?: number;
  dailySpendCap?: number | null;
  onboardingStep?: string;
  role?: string;
}) {
  seq += 1;
  const name = input.name ?? `Student ${seq}`;
  return prisma().user.create({
    data: {
      email: input.email ?? `student${seq}@lincoln.example`,
      schoolId: input.schoolId,
      emailVerifiedAt: new Date(),
      displayName: name,
      handle: `student_${seq}`,
      grade: 11,
      dateOfBirth: input.dob ?? "2008-06-15",
      directoryOptIn: input.directoryOptIn ?? true,
      autopilotOptIn: input.autopilotOptIn ?? false,
      memoryOptIn: input.memoryOptIn ?? false,
      parentalConsentAt: input.parentalConsentAt,
      allowAnonymous: input.allowAnonymous ?? true,
      gems: input.gems ?? 200,
      dailySpendCap: input.dailySpendCap,
      onboardingStep: input.onboardingStep ?? "done",
      role: input.role ?? "student",
    },
  });
}
