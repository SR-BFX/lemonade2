import { NextResponse } from "next/server";
import { INVITE_COOKIE } from "@/server/session";
import { getPrisma } from "@/lib/prisma";

export async function GET(request: Request, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  const invite = await getPrisma().invite.findUnique({ where: { code: code.toUpperCase() } });
  if (!invite) {
    return NextResponse.redirect(new URL("/onboarding/school?error=Invite%20not%20found", request.url));
  }
  const response = NextResponse.redirect(new URL(`/onboarding/email?school=${invite.schoolId}`, request.url));
  response.cookies.set(INVITE_COOKIE, invite.code, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  return response;
}
