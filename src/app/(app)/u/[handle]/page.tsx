import { notFound } from "next/navigation";
import Link from "next/link";
import { Flash, Screen } from "@/components/chrome";
import { formatGrade, levelFor } from "@/lib/catalog";
import { isDiscoverable, romanticAllowed } from "@/lib/eligibility";
import { mutualCrushIds } from "@/lib/social";
import { getPrisma } from "@/lib/prisma";
import { submitBlock, submitReport } from "@/server/app-actions";
import { getCurrentUser } from "@/server/session";

export const dynamic = "force-dynamic";

export default async function UserPage({ params, searchParams }: { params: Promise<{ handle: string }>; searchParams: Promise<{ error?: string; notice?: string }> }) {
  const { handle } = await params;
  const query = await searchParams;
  const viewer = await getCurrentUser();
  if (!viewer) return null;
  const person = await getPrisma().user.findUnique({ where: { handle }, include: { school: true } });
  if (!person || !isDiscoverable(person) || person.schoolId !== viewer.schoolId) notFound();
  const mutual = (await mutualCrushIds(viewer.id)).includes(person.id);
  const blocked = await getPrisma().block.findFirst({ where: { blockerId: viewer.id, blockedId: person.id } });
  const stat = await getPrisma().socialStat.findUnique({ where: { userId_otherId: { userId: viewer.id, otherId: person.id } } });

  return (
    <main>
      <Screen title={person.displayName || "Student"} subtitle={`@${person.handle}`} back={{ href: "/discover" }}>
        <Flash error={query.error} notice={query.notice} />
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-lemon-200 text-3xl">{person.avatarEmoji}</div>
            <div>
              <p className="font-extrabold">{person.traits || "Classmate"}</p>
              <p className="text-sm font-bold text-ink/70">{person.clubs || "No clubs listed"}</p>
              <p className="text-sm font-bold">{person.grade ? formatGrade(person.grade) : ""} grade · Level {levelFor(person.points)} · {person.points} pts</p>
            </div>
          </div>
          {person.bio ? <p className="mt-3 text-sm font-semibold">{person.bio}</p> : null}
          <p className="mt-3 text-sm font-extrabold">Friendship {stat?.friendship ?? 20}% · Interest {stat?.interest ?? "Low"}</p>
          {mutual && romanticAllowed(viewer) && romanticAllowed(person) ? (
            <p className="mt-2 rounded-2xl bg-blush/10 px-3 py-2 text-sm font-extrabold text-blush">It&apos;s mutual. You both picked each other.</p>
          ) : null}
          <div className="mt-4 flex gap-2">
            <Link className="btn-lemon" href="/gifts">Send a gift</Link>
          </div>
          {blocked ? <p className="mt-3 text-sm font-bold">You blocked {person.displayName}. Unblock from Settings.</p> : (
            <form action={submitBlock} className="mt-3">
              <input type="hidden" name="userId" value={person.id} />
              <input type="hidden" name="handle" value={person.handle ?? ""} />
              <button className="btn-ghost" type="submit">Block</button>
            </form>
          )}
          <form action={submitReport} className="mt-3 space-y-2">
            <input type="hidden" name="targetType" value="user" />
            <input type="hidden" name="targetId" value={person.id} />
            <input type="hidden" name="back" value={`/u/${person.handle}`} />
            <label className="label">Report
              <input className="field" name="reason" placeholder="What happened?" required />
            </label>
            <button className="btn-ghost" type="submit">Send report</button>
          </form>
          <p className="mt-4 text-xs font-bold text-ink/50">{person.school.name}. Age stays on their own profile.</p>
        </div>
      </Screen>
    </main>
  );
}
