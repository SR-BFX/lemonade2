import Link from "next/link";
import { submitSchoolRequest } from "@/server/auth-actions";
import { Flash } from "@/components/chrome";
import { LIVE_SCHOOL_COUNT } from "@/lib/catalog";
import { countDiscoverable } from "@/lib/eligibility";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SchoolPage({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string }> }) {
  const query = await searchParams;
  const prisma = getPrisma();
  const schools = await prisma.school.findMany({ orderBy: { distanceMiles: "asc" } });
  const counts = await Promise.all(schools.map(async (school) => ({ id: school.id, count: await countDiscoverable(school.id) })));
  const countOf = new Map(counts.map((row) => [row.id, row.count]));

  return (
    <main>
      <header className="bg-gradient-to-b from-lemon-200 to-lemon-100 px-5 pb-5 pt-8">
        <p className="text-3xl">🍋</p>
        <h1 className="text-3xl font-extrabold">Lemonade</h1>
        <p className="font-bold text-ink/70">Select your high school to get started</p>
      </header>
      <Flash error={query.error} notice={query.notice} />
      <div className="px-4 py-4">
        <h2 className="text-sm font-extrabold">Schools near you</h2>
        <p className="text-xs font-semibold text-ink/60">Counts are students who joined Lemonade and opted in. A school shows as live at {LIVE_SCHOOL_COUNT}.</p>
        <ul className="mt-3 space-y-2">
          {schools.map((school) => {
            const here = countOf.get(school.id) ?? 0;
            return (
              <li key={school.id}>
                <Link href={`/onboarding/email?school=${school.id}`} className="card flex items-center gap-3">
                  <span className="min-w-0 flex-1">
                    <span className="block font-extrabold">{school.name}</span>
                    <span className="block text-xs font-bold text-ink/60">
                      {school.kind} · Grades {school.grades} · {school.distanceMiles} mi
                    </span>
                    <span className="mt-1 inline-block rounded-full bg-lemon-100 px-2 py-0.5 text-xs font-extrabold">
                      {here} on Lemonade {here >= LIVE_SCHOOL_COUNT ? "· Live" : "· Not live"}
                    </span>
                  </span>
                  <span className="text-xl" aria-hidden>›</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <details className="card mt-4">
          <summary className="cursor-pointer font-extrabold">Can&apos;t find your school? Request to add it</summary>
          <form action={submitSchoolRequest} className="mt-3 space-y-2">
            <label className="label">School name<input className="field" name="name" required /></label>
            <label className="label">City<input className="field" name="city" required /></label>
            <label className="label">Email domain<input className="field" name="domain" placeholder="students.example" required /></label>
            <label className="label">Your email<input className="field" name="contactEmail" type="email" required /></label>
            <button className="btn-lemon" type="submit">Request school</button>
            <p className="text-xs font-semibold text-ink/60">We don&apos;t take roster uploads. A school is just a name and an email domain.</p>
          </form>
        </details>
      </div>
    </main>
  );
}
