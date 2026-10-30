import { cookies } from "next/headers";
import { destroySession, loadUser, userIdForSession } from "@/lib/auth";

export const SESSION_COOKIE = "lemonade_session";
export const INVITE_COOKIE = "lemonade_invite";

export async function getCurrentUser() {
  const jar = await cookies();
  const userId = await userIdForSession(jar.get(SESSION_COOKIE)?.value);
  if (!userId) return null;
  return loadUser(userId);
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  await destroySession(jar.get(SESSION_COOKIE)?.value);
  jar.delete(SESSION_COOKIE);
}

export async function inviteFromCookie() {
  const jar = await cookies();
  return jar.get(INVITE_COOKIE)?.value;
}
