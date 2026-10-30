import { beforeEach, describe, expect, it } from "vitest";
import { approveParentalConsent, requestSchoolCode, verifySchoolCode } from "@/lib/auth";
import { runAutopilot } from "@/lib/autopilot";
import { isDiscoverable } from "@/lib/eligibility";
import { sendGift } from "@/lib/gifts";
import { saveCircle, saveProfile } from "@/lib/profile";
import { makeSchool, makeUser, prisma, resetDatabase } from "./helpers";

beforeEach(async () => {
  await resetDatabase();
});

async function codeFor(email: string) {
  const message = await prisma().emailMessage.findFirst({ where: { to: email }, orderBy: { createdAt: "desc" } });
  return message?.body.match(/\b(\d{6})\b/)?.[1] ?? "";
}

describe("consent gating", () => {
  it("hides under-16 students until a parent approves, then still blocks romance and overspending", async () => {
    const school = await makeSchool();
    const email = "sam.lee@lincoln.example";
    const requested = await requestSchoolCode({
      schoolId: school.id,
      email,
      dateOfBirth: "2011-06-01",
      parentEmail: "parent@example.com",
    });
    expect(requested.ok).toBe(true);
    const verified = await verifySchoolCode({ email, code: await codeFor(email) });
    expect(verified.ok).toBe(true);
    if (!verified.ok) return;

    const profile = await saveProfile({
      userId: verified.data.userId,
      displayName: "Sam Lee",
      handle: "sam_lee",
      grade: 9,
      avatarEmoji: "🍋",
      bio: "",
      traits: "Quiet",
      clubs: "Chess",
      directoryOptIn: true,
      autopilotOptIn: true,
      memoryOptIn: true,
    });
    expect(profile.ok).toBe(true);
    await saveCircle({ userId: verified.data.userId, friendIds: [], crushIds: [], finishOnboarding: true });

    const hidden = await prisma().user.findUnique({ where: { id: verified.data.userId } });
    expect(hidden && isDiscoverable(hidden)).toBe(false);
    const skipped = await runAutopilot({ force: true, onlyUserId: verified.data.userId });
    expect(skipped.created).toBe(0);

    const adult = await makeUser({ schoolId: school.id, name: "Alex Adult", email: "alex.adult@lincoln.example" });
    const gift = await sendGift({ fromId: adult.id, toId: verified.data.userId, giftKey: "cupcake", anonymous: false, message: "hi" });
    expect(gift.ok).toBe(false);

    const parentMail = await prisma().emailMessage.findFirst({ where: { to: "parent@example.com" } });
    const token = parentMail?.body.match(/consent\/([a-f0-9]+)/)?.[1];
    expect(token).toBeTruthy();
    const approved = await approveParentalConsent(token!);
    expect(approved.ok).toBe(true);

    const visible = await prisma().user.findUnique({ where: { id: verified.data.userId } });
    expect(visible && isDiscoverable(visible)).toBe(true);

    const kiss = await sendGift({ fromId: visible!.id, toId: adult.id, giftKey: "kiss", anonymous: false, message: "" });
    expect(kiss.ok).toBe(false);
    if (!kiss.ok) expect(kiss.error).toMatch(/16/);

    const crush = await saveCircle({ userId: visible!.id, friendIds: [adult.id], crushIds: [adult.id] });
    expect(crush.ok).toBe(false);

    const priced = await sendGift({ fromId: visible!.id, toId: adult.id, giftKey: "strawberry", anonymous: false, message: "" });
    expect(priced.ok).toBe(true);
    const over = await sendGift({ fromId: visible!.id, toId: adult.id, giftKey: "ice-cream", anonymous: false, message: "" });
    expect(over.ok).toBe(false);
    if (!over.ok) expect(over.error).toMatch(/cap/i);
  });

  it("does not require parental consent at 16 or older", async () => {
    const school = await makeSchool();
    const email = "older@lincoln.example";
    await requestSchoolCode({ schoolId: school.id, email, dateOfBirth: "2008-06-15" });
    const verified = await verifySchoolCode({ email, code: await codeFor(email) });
    expect(verified.ok).toBe(true);
    if (!verified.ok) return;
    const user = await prisma().user.findUnique({ where: { id: verified.data.userId } });
    expect(user?.parentEmail).toBeNull();
    expect(await prisma().parentalConsent.count()).toBe(0);
  });
});
