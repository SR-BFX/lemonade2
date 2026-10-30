import { beforeEach, describe, expect, it } from "vitest";
import { requestSchoolCode, verifySchoolCode } from "@/lib/auth";
import { latestCodeFor } from "@/lib/email";
import { makeSchool, prisma, resetDatabase } from "./helpers";

beforeEach(async () => {
  await resetDatabase();
});

describe("school email verification", () => {
  it("rejects an email outside the school domain", async () => {
    const school = await makeSchool();
    const result = await requestSchoolCode({
      schoolId: school.id,
      email: "alex@gmail.com",
      dateOfBirth: "2008-06-15",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/lincoln.example/);
  });

  it("rejects students under 13", async () => {
    const school = await makeSchool();
    const result = await requestSchoolCode({
      schoolId: school.id,
      email: "kid@lincoln.example",
      dateOfBirth: "2015-01-01",
    });
    expect(result.ok).toBe(false);
  });

  it("sends a code, verifies it once, and then accepts a fresh login code", async () => {
    const school = await makeSchool();
    const email = "alex.johnson@lincoln.example";
    const requested = await requestSchoolCode({
      schoolId: school.id,
      email,
      dateOfBirth: "2008-06-15",
    });
    expect(requested.ok).toBe(true);
    const code = await latestCodeFor(email);
    expect(code).toMatch(/^\d{6}$/);

    const wrong = await verifySchoolCode({ email, code: "000000" });
    expect(wrong.ok).toBe(false);

    const verified = await verifySchoolCode({ email, code: code! });
    expect(verified.ok).toBe(true);
    if (!verified.ok) return;
    const user = await prisma().user.findUnique({ where: { id: verified.data.userId } });
    expect(user?.emailVerifiedAt).toBeTruthy();
    expect(user?.schoolId).toBe(school.id);
    expect(user?.onboardingStep).toBe("profile");

    const reused = await verifySchoolCode({ email, code: code! });
    expect(reused.ok).toBe(false);

    const login = await requestSchoolCode({ schoolId: school.id, email });
    expect(login.ok).toBe(true);
    if (login.ok) expect(login.data.purpose).toBe("login");
    const nextCode = await latestCodeFor(email);
    const again = await verifySchoolCode({ email, code: nextCode! });
    expect(again.ok).toBe(true);
  });
});
