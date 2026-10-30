import Link from "next/link";
import { Flash, Screen } from "@/components/chrome";
import { formatGrade, lastFirst } from "@/lib/catalog";
import { isDiscoverable } from "@/lib/eligibility";
import { getPrisma } from "@/lib/prisma";
import { getCurrentUser } from "@/server/session";

export const dynamic = "force-dynamic";

export default async function DiscoverPage({ searchParams }: { searchParams: Promise<{ grade?: string; q?: string }> }) {
  const query = await searchParams;
  const user = await getCurrentUser();
  if (!user) return null;
  const grade = query.grade ? Number(query.grade) : 0;
  const q = (query.q ?? "").trim().toLowerCase();
  const students = (await getPrisma().user.findMany({ where: { schoolId: user.schoolId }, orderBy: { displayName: "asc" } }))
    .filter((student) => isDiscoverable(student) && student.id !== user.id)
    .filter((student) => !grade || student.grade === grade)
    .filter((student) => !q || `${student.displayName} ${student.clubs}`.toLowerCase().includes(q));
  const grades = [0, 9, 10, 11, 12];

  return (
    <main>
      <Screen title="Student directory" subtitle="Verified students who opted in">
        <Flash />
        <form className="px-4 pt-3" action="/discover">
          <input className="field" name="q" defaultValue={query.q ?? ""} placeholder="Search name or club" />
        </form>
        <div className="flex gap-2 overflow-x-auto px-4 py-3 text-sm font-extrabold">
          {grades.map((item) => (
            <Link key={item} href={item ? `/discover?grade=${item}` : "/discover"} className={`rounded-full px-3 py-1 ${(!item && !grade) || item === grade ? "bg-ink text-white" : "bg-lemon-100"}`}>
              {item ? formatGrade(item) : "All"}
            </Link>
          ))}
        </div>
        {[9, 10, 11, 12].map((level) => {
          const group = students.filter((student) => student.grade === level);
          if (!group.length) return null;
          return (
            <section key={level} className="px-4 pb-4">
              <h2 className="mb-2 font-extrabold">{formatGrade(level)} grade ({group.length})</h2>
              <ul className="space-y-2">
                {group.map((student) => (
                  <li key={student.id} className="card flex items-center gap-3">
                    <span className="text-2xl">{student.avatarEmoji}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-extrabold">{lastFirst(student.displayName || "")}</span>
                      <span className="block text-xs font-bold text-ink/60">{student.clubs || "No clubs listed"}</span>
                    </span>
                    <span className="text-sm font-extrabold">{student.points}</span>
                    <Link className="btn-ghost" href={`/u/${student.handle}`}>Profile</Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
        {students.length === 0 ? <p className="px-4 pb-6 text-sm font-bold">Nobody else from your school is visible with that filter.</p> : null}
      </Screen>
    </main>
  );
}
