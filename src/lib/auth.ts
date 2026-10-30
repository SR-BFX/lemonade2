import { ageFromDob, dayKey, isUnder16, validateDob, yesterdayKey } from "./age";
import { sendEmail } from "./email";
import { getPrisma } from "./prisma";
import { err, ok, type Result } from "./result";
import { appUrl, randomCode, randomToken, sha256 } from "./tokens";

const CODE_MINUTES = 15;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function domainOf(email: string): string {
  return email.split("@")[1] ?? "";
}

export async function requestSchoolCode(input: {
  schoolId: string;
  email: string;
  dateOfBirth?: string;
  parentEmail?: string;
  inviteCode?: string;
  now?: Date;
}): Promise<Result<{ purpose: "signup" | "login" }>> {
  const now = input.now ?? new Date();
  const email = normalizeEmail(input.email);
  const prisma = getPrisma();
  const school = await prisma.school.findUnique({ where: { id: input.schoolId } });
  if (!school) return err("Pick a school from the list.");
  if (!email.includes("@") || domainOf(email) !== school.emailDomain) {
    return err(`Use your ${school.name} email (@${school.emailDomain}).`);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing?.deletedAt) return err("That account was deleted. Use a different school email if you return later.");

  let purpose: "signup" | "login" = "login";
  let dateOfBirth: string | null = null;
  let parentEmail: string | null = null;

  if (!existing) {
    purpose = "signup";
    const dob = (input.dateOfBirth ?? "").trim();
    const dobError = validateDob(dob, now);
    if (dobError) return err(dobError);
    dateOfBirth = dob;
    if (isUnder16(dob, now)) {
      parentEmail = normalizeEmail(input.parentEmail ?? "");
      if (!parentEmail.includes("@") || parentEmail === email) {
        return err("Under 16s need a parent or guardian email. We'll send them an approve link.");
      }
    }
  }

  const code = randomCode();
  const expiresAt = new Date(now.getTime() + CODE_MINUTES * 60 * 1000);
  await prisma.verificationCode.updateMany({
    where: { email, consumedAt: null },
    data: { consumedAt: now },
  });
  await prisma.verificationCode.create({
    data: {
      email,
      schoolId: school.id,
      codeHash: sha256(code),
      dateOfBirth,
      parentEmail,
      inviteCode: input.inviteCode?.trim() || null,
      purpose,
      expiresAt,
    },
  });
  await sendEmail(
    email,
    "Your Lemonade verification code",
    `Your Lemonade code is ${code}. It expires in ${CODE_MINUTES} minutes.\n\nIf you didn't ask for this, you can ignore it.`,
  );
  return ok({ purpose });
}

async function issueParentalConsent(userId: string, parentEmail: string, studentName: string, now: Date) {
  const prisma = getPrisma();
  const token = randomToken();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  await prisma.parentalConsent.deleteMany({ where: { userId, status: "pending" } });
  await prisma.parentalConsent.create({
    data: {
      userId,
      parentEmail,
      tokenHash: sha256(token),
      status: "pending",
      expiresAt,
    },
  });
  await sendEmail(
    parentEmail,
    "Approve a Lemonade account",
    `${studentName} wants to join Lemonade, a school social app for students who sign themselves up.\n\nApprove this account (link expires in 7 days):\n${appUrl()}/consent/${token}\n\nIf you don't recognize this, ignore the email. Nothing goes live until you approve.`,
  );
  return token;
}

export async function verifySchoolCode(input: {
  email: string;
  code: string;
  now?: Date;
}): Promise<Result<{ userId: string; isNew: boolean }>> {
  const now = input.now ?? new Date();
  const email = normalizeEmail(input.email);
  const prisma = getPrisma();
  const pending = await prisma.verificationCode.findFirst({
    where: { email, consumedAt: null, expiresAt: { gt: now } },
    orderBy: { createdAt: "desc" },
  });
  if (!pending || !safeCode(input.code, pending.codeHash)) {
    return err("That code doesn't match or it expired. Request a new one.");
  }

  await prisma.verificationCode.update({ where: { id: pending.id }, data: { consumedAt: now } });

  let user = await prisma.user.findUnique({ where: { email } });
  let isNew = false;
  if (!user) {
    if (!pending.dateOfBirth) return err("Signup details were missing. Start again.");
    isNew = true;
    const under = isUnder16(pending.dateOfBirth, now);
    user = await prisma.user.create({
      data: {
        email,
        schoolId: pending.schoolId,
        dateOfBirth: pending.dateOfBirth,
        emailVerifiedAt: now,
        parentEmail: pending.parentEmail,
        dailySpendCap: under ? 40 : null,
        onboardingStep: "profile",
        gems: 80,
        stars: 30,
        lastActiveOn: dayKey(now),
        streak: 1,
      },
    });
    if (under && pending.parentEmail) {
      await issueParentalConsent(user.id, pending.parentEmail, "Your child", now);
    }
    if (pending.inviteCode) {
      const invite = await prisma.invite.findUnique({ where: { code: pending.inviteCode.toUpperCase() } });
      if (invite) await prisma.invite.update({ where: { id: invite.id }, data: { uses: { increment: 1 } } });
    }
  } else {
    const today = dayKey(now);
    let streak = user.streak;
    if (user.lastActiveOn === yesterdayKey(now)) streak += 1;
    else if (user.lastActiveOn !== today) streak = 1;
    user = await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: user.emailVerifiedAt ?? now, lastActiveOn: today, streak },
    });
  }

  return ok({ userId: user.id, isNew });
}

function safeCode(code: string, hash: string): boolean {
  const normalized = code.trim();
  if (!/^\d{6}$/.test(normalized)) return false;
  return sha256(normalized) === hash;
}

export async function createSession(userId: string, now = new Date()): Promise<string> {
  const prisma = getPrisma();
  const token = randomToken();
  await prisma.session.create({
    data: {
      userId,
      tokenHash: sha256(token),
      expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
    },
  });
  return token;
}

export async function userIdForSession(token: string | undefined, now = new Date()): Promise<string | null> {
  if (!token) return null;
  const prisma = getPrisma();
  const session = await prisma.session.findUnique({ where: { tokenHash: sha256(token) } });
  if (!session || session.expiresAt < now) return null;
  return session.userId;
}

export async function destroySession(token: string | undefined) {
  if (!token) return;
  const prisma = getPrisma();
  await prisma.session.deleteMany({ where: { tokenHash: sha256(token) } });
}

export async function approveParentalConsent(token: string, now = new Date()): Promise<Result<{ studentName: string }>> {
  const prisma = getPrisma();
  const row = await prisma.parentalConsent.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: true },
  });
  if (!row) return err("This approval link isn't valid.");
  if (row.expiresAt < now || row.status === "expired") return err("This approval link has expired. Ask your child to send a new one.");
  if (row.status !== "approved") {
    await prisma.parentalConsent.update({
      where: { id: row.id },
      data: { status: "approved", approvedAt: now },
    });
    await prisma.user.update({
      where: { id: row.userId },
      data: { parentalConsentAt: now },
    });
  }
  return ok({ studentName: row.user.displayName || "Your child" });
}

export async function resendParentalConsent(userId: string, now = new Date()): Promise<Result<{ sentTo: string }>> {
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.parentEmail) return err("No parent email is on file.");
  if (user.parentalConsentAt) return err("A parent already approved this account.");
  if (ageFromDob(user.dateOfBirth, now) >= 16) return err("Parental approval isn't required for this account.");
  await issueParentalConsent(user.id, user.parentEmail, user.displayName || "Your child", now);
  return ok({ sentTo: user.parentEmail });
}

export async function loadUser(userId: string) {
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { school: true } });
  if (!user || user.deletedAt) return null;
  return user;
}
