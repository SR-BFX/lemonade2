import { notFound } from "next/navigation";
import { Flash, Screen } from "@/components/chrome";
import { getPrisma } from "@/lib/prisma";
import { requestCode } from "@/server/auth-actions";

export const dynamic = "force-dynamic";

export default async function EmailPage({ searchParams }: { searchParams: Promise<{ school?: string; error?: string }> }) {
  const query = await searchParams;
  if (!query.school) notFound();
  const school = await getPrisma().school.findUnique({ where: { id: query.school } });
  if (!school) notFound();

  return (
    <main>
      <Screen title="Verify school email" subtitle={school.name} back={{ href: "/onboarding/school" }}>
        <Flash error={query.error} />
        <form action={requestCode} className="space-y-3 px-4 py-4">
          <input type="hidden" name="schoolId" value={school.id} />
          <p className="text-sm font-semibold text-ink/70">
            Use your official {school.name} email (@{school.emailDomain}). We send a one-time code. In dev it also shows up in the server log and at /dev/mail.
          </p>
          <label className="label">School email address
            <input className="field" type="email" name="email" placeholder={`you@${school.emailDomain}`} required />
          </label>
          <label className="label">Date of birth
            <input className="field" type="date" name="dateOfBirth" required />
          </label>
          <p className="text-xs font-bold text-ink/60">Age gate: 13–19. If you&apos;re under 16, add a parent email. They must approve before your profile is visible or autopilot can run.</p>
          <label className="label">Parent or guardian email (required under 16)
            <input className="field" type="email" name="parentEmail" placeholder="parent@example.com" />
          </label>
          <button className="btn-lemon" type="submit">Send verification code</button>
          <p className="text-center text-xs font-bold text-ink/50">Your email isn&apos;t shown on your profile. <a className="underline" href="/support">Contact support</a></p>
        </form>
      </Screen>
    </main>
  );
}
