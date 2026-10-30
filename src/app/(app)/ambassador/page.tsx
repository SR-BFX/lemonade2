import Link from "next/link";
import { Flash, Screen } from "@/components/chrome";
import { formatGrade, LIVE_SCHOOL_COUNT } from "@/lib/catalog";
import { countDiscoverable } from "@/lib/eligibility";
import { getPrisma } from "@/lib/prisma";
import { submitAmbassador } from "@/server/app-actions";
import { getCurrentUser } from "@/server/session";

export const dynamic = "force-dynamic";

export default async function AmbassadorPage({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string }> }) {
  const query = await searchParams;
  const user = await getCurrentUser();
  if (!user) return null;
  const [here, application] = await Promise.all([
    countDiscoverable(user.schoolId),
    getPrisma().ambassadorApplication.findUnique({ where: { userId: user.id } }),
  ]);
  const live = here >= LIVE_SCHOOL_COUNT;
  return (
    <main>
      <Screen title="Ambassador" subtitle="Promote Lemonade. Don't upload a roster." back={{ href: "/profile" }}>
        <Flash error={query.error} notice={query.notice} />
        <div className="space-y-3 px-4 py-4">
          <div className="card">
            <h2 className="text-lg font-extrabold">{user.school.name}</h2>
            <p className="text-sm font-bold text-ink/70">{user.school.kind} · {here} verified student{here === 1 ? "" : "s"}</p>
            <p className={`mt-2 inline-block rounded-full px-2 py-1 text-xs font-extrabold ${live ? "bg-leaf/15 text-leaf" : "bg-lemon-200"}`}>{live ? "Live" : "Not live"}</p>
          </div>
          <section className="card">
            <h3 className="font-extrabold">Become a Lemonade ambassador</h3>
            <p className="mt-1 text-sm font-semibold">Help classmates find the app and share your invite link. You earn a review, not a student list to import.</p>
            <ul className="mt-2 space-y-1 text-sm font-bold">
              <li>Program perk: up to $100/month after approval, paid outside this demo</li>
              <li>Build a network of people who chose to join</li>
              <li>Leadership experience and a badge on your profile once approved</li>
            </ul>
          </section>
          <section className="card text-sm font-bold">
            <p>We&apos;re looking for students who are active with friends, well-connected at school, and fine inviting people one link at a time.</p>
          </section>
          {application?.status === "approved" ? (
            <p className="rounded-2xl bg-leaf/10 px-3 py-2 text-sm font-extrabold text-leaf">You&apos;re an ambassador. Share your invite link. There is no roster upload.</p>
          ) : application ? (
            <p className="rounded-2xl bg-lemon-100 px-3 py-2 text-sm font-extrabold">Application {application.status}. We&apos;ll review it within 2–3 business days.</p>
          ) : null}
          {application?.status !== "approved" ? (
            <form action={submitAmbassador} className="space-y-2">
              <p className="label">Grade</p>
              <div className="flex gap-2">
                {[9, 10, 11, 12].map((grade) => (
                  <label key={grade} className="rounded-full bg-lemon-100 px-3 py-1 text-sm font-extrabold">
                    <input type="radio" name="grade" value={grade} defaultChecked={grade === (user.grade ?? 11)} className="mr-1" />
                    {formatGrade(grade)}
                  </label>
                ))}
              </div>
              <label className="label">How will you invite people?
                <textarea className="field" name="pitch" rows={3} placeholder="I'll share my link with clubs I actually attend." required />
              </label>
              <button className="btn-lemon" type="submit">Apply to be an ambassador</button>
            </form>
          ) : null}
          <Link href="/invite" className="btn-ghost w-full">Open my invite link</Link>
        </div>
      </Screen>
    </main>
  );
}
