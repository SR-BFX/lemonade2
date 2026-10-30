"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSession, requestSchoolCode, verifySchoolCode } from "@/lib/auth";
import { requestNewSchool } from "@/lib/ambassador";
import { clearSessionCookie, INVITE_COOKIE, inviteFromCookie, setSessionCookie } from "@/server/session";
import { loadUser } from "@/lib/auth";

function go(path: string, error?: string): never {
  redirect(error ? `${path}${path.includes("?") ? "&" : "?"}error=${encodeURIComponent(error)}` : path);
}

export async function requestCode(formData: FormData) {
  const schoolId = String(formData.get("schoolId") || "");
  const email = String(formData.get("email") || "");
  const result = await requestSchoolCode({
    schoolId,
    email,
    dateOfBirth: String(formData.get("dateOfBirth") || ""),
    parentEmail: String(formData.get("parentEmail") || ""),
    inviteCode: (await inviteFromCookie()) || undefined,
  });
  const back = `/onboarding/email?school=${encodeURIComponent(schoolId)}`;
  if (!result.ok) go(back, result.error);
  go(`/onboarding/verify?email=${encodeURIComponent(email.trim().toLowerCase())}`);
}

export async function submitCode(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const code = String(formData.get("code") || "");
  const result = await verifySchoolCode({ email, code });
  if (!result.ok) go(`/onboarding/verify?email=${encodeURIComponent(email)}`, result.error);
  const token = await createSession(result.data.userId);
  await setSessionCookie(token);
  const user = await loadUser(result.data.userId);
  if (!user || user.onboardingStep === "profile") go("/onboarding/profile");
  if (user.onboardingStep === "people") go("/onboarding/people");
  go("/home");
}

export async function logout() {
  await clearSessionCookie();
  const jar = await cookies();
  jar.delete(INVITE_COOKIE);
  redirect("/");
}

export async function submitSchoolRequest(formData: FormData) {
  const result = await requestNewSchool({
    name: String(formData.get("name") || ""),
    city: String(formData.get("city") || ""),
    domain: String(formData.get("domain") || ""),
    contactEmail: String(formData.get("contactEmail") || ""),
  });
  if (!result.ok) go("/onboarding/school", result.error);
  go("/onboarding/school?notice=Request%20received.%20We%20add%20schools%20by%20hand%20%E2%80%94%20never%20from%20a%20roster.");
}
