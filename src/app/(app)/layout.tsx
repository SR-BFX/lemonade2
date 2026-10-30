import Link from "next/link";
import { redirect } from "next/navigation";
import { BottomNav } from "@/components/nav";
import { isUnder16 } from "@/lib/age";
import { getCurrentUser } from "@/server/session";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (user.onboardingStep === "profile") redirect("/onboarding/profile");
  if (user.onboardingStep === "people") redirect("/onboarding/people");
  const waiting = isUnder16(user.dateOfBirth) && !user.parentalConsentAt;
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex-1 pb-20">
        {user.suspendedAt ? (
          <p className="bg-blush px-4 py-2 text-sm font-extrabold text-white">This account is suspended. You can export or delete your data in Settings.</p>
        ) : null}
        {waiting ? (
          <p className="bg-lemon-300 px-4 py-2 text-sm font-extrabold">
            Waiting for a parent to approve {user.parentEmail}. Your profile stays hidden and autopilot stays off until then.{" "}
            <Link href="/settings" className="underline">Resend</Link>
          </p>
        ) : null}
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
