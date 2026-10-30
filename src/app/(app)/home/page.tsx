import Link from "next/link";
import { Counter, Flash } from "@/components/chrome";
import { formatWhen, formatDay } from "@/lib/format";
import { countDiscoverable } from "@/lib/eligibility";
import { leaderboard, rankOf } from "@/lib/leaderboard";
import { mutualCrushIds } from "@/lib/social";
import { getPrisma } from "@/lib/prisma";
import { getCurrentUser } from "@/server/session";

export const dynamic = "force-dynamic";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string }> }) {
  const query = await searchParams;
  const user = await getCurrentUser();
  if (!user) return null;
  const prisma = getPrisma();
  const [events, friends, giftCount, polls, board, mutualIds, here] = await Promise.all([
    prisma.feedEvent.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.friendship.count({ where: { userId: user.id } }),
    prisma.giftSend.count({ where: { toId: user.id, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
    prisma.poll.count({ where: { schoolId: user.schoolId } }),
    leaderboard(user.schoolId, "all"),
    mutualCrushIds(user.id),
    countDiscoverable(user.schoolId),
  ]);
  const mutualPeople = mutualIds.length
    ? await prisma.user.findMany({ where: { id: { in: mutualIds } } })
    : [];
  const rank = rankOf(board, user.id);
  const empty = events.length === 0 && friends === 0;

  return (
    <main>
      <header className="bg-gradient-to-b from-lemon-200 to-white px-5 pb-4 pt-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold">{empty ? "🍋 Lemonade" : "Daily Summary"}</h1>
          <span className="text-sm font-extrabold">{formatDay(new Date())}</span>
        </div>
        <nav className="mt-3 flex justify-between text-center text-xs font-extrabold">
          <Link href="/home">🏠<br />Home</Link>
          <Link href="/polls">🗳️<br />Polls</Link>
          <Link href="/gifts">🎁<br />Gifts</Link>
          <Link href="/leaderboard">🏆<br />Leaderboard</Link>
        </nav>
      </header>
      <Flash error={query.error} notice={query.notice} />
      {mutualIds.length ? (
        <p className="mx-4 mt-3 rounded-2xl bg-blush/10 px-3 py-2 text-sm font-extrabold text-blush">It&apos;s mutual with {mutualPeople.map((person) => person.displayName).join(", ")}. Only you two can see that.</p>
      ) : null}
      {empty ? (
        <section className="px-5 py-6 text-center">
          <p className="text-4xl">👋 ✨ 🎉</p>
          <h2 className="mt-2 text-2xl font-extrabold">Welcome to Lemonade!</h2>
          <p className="mt-1 font-bold text-ink/70">Your school social hub awaits</p>
          <p className="mt-2 text-sm font-semibold">Connect with classmates who joined, vote in polls, and climb a leaderboard that only counts real activity.</p>
          <ul className="mt-4 space-y-2 text-left">
            <li className="card flex items-center gap-3"><span className="text-2xl">🗳️</span><span><b>Fun school polls</b><br /><span className="text-xs font-semibold text-ink/60">Vote on light prompts. Never about teachers.</span></span></li>
            <li className="card flex items-center gap-3"><span className="text-2xl">💕</span><span><b>Secret crushes</b><br /><span className="text-xs font-semibold text-ink/60">16+ and private unless it&apos;s mutual.</span></span></li>
            <li className="card flex items-center gap-3"><span className="text-2xl">🏆</span><span><b>Popularity contest</b><br /><span className="text-xs font-semibold text-ink/60">Points come from gifts, polls, and choices.</span></span></li>
          </ul>
          <Link href="/invite" className="btn-lemon mt-4">Invite your first friend</Link>
          <Link href="/discover" className="btn-ghost mt-2 w-full">See who&apos;s here</Link>
          <p className="mt-4 text-sm font-extrabold">
            {here === 0 ? `You're the first from ${user.school.name} on Lemonade.` : `${here} student${here === 1 ? "" : "s"} from ${user.school.name} ${here === 1 ? "is" : "are"} already here.`}
          </p>
          <p className="mt-1 text-2xl">😊 🤩 😎</p>
        </section>
      ) : (
        <section>
          <div className="mx-4 mt-3 flex rounded-3xl border-2 border-lemon-200 bg-white py-3">
            <Counter value={rank ? `#${rank}` : "–"} label="Rank" />
            <Counter value={polls} label="Polls" />
            <Counter value={friends} label="Friends" />
            <Counter value={giftCount} label="Gifts" />
          </div>
          {!user.autopilotOptIn ? (
            <p className="mx-4 mt-3 text-sm font-bold text-ink/70">Overnight autopilot is off. Turn it on in <Link className="underline" href="/settings">Settings</Link> if you want an agent to write events while you sleep.</p>
          ) : null}
          <ol className="mt-2">
            {events.map((event) => (
              <li key={event.id} className="flex gap-3 border-b border-lemon-100 px-4 py-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-lemon-100 text-xl">{event.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-extrabold text-ink/50">{formatWhen(event.createdAt)}</p>
                  <p className="font-extrabold leading-snug">{event.title}</p>
                  <div className="mt-2 flex gap-2">
                    <Link className="btn-ghost" href={`/events/${event.id}`}>Details</Link>
                    <Link className="btn-solid" href={`/events/${event.id}#respond`}>{event.status === "open" ? "Respond" : "Your choice"}</Link>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </main>
  );
}
