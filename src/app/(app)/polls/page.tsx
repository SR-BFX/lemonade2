import Link from "next/link";
import { Screen } from "@/components/chrome";
import { formatWhen, plural } from "@/lib/format";
import { getPrisma } from "@/lib/prisma";
import { getCurrentUser } from "@/server/session";

export const dynamic = "force-dynamic";

export default async function PollsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const query = await searchParams;
  const user = await getCurrentUser();
  if (!user) return null;
  const tab = query.tab === "yours" ? "yours" : query.tab === "recent" ? "recent" : "popular";
  const polls = await getPrisma().poll.findMany({
    where: { schoolId: user.schoolId, ...(tab === "yours" ? { authorId: user.id } : {}) },
    include: { author: true, options: { include: { votes: true } }, comments: true },
    orderBy: { createdAt: "desc" },
  });
  const ranked = tab === "popular"
    ? [...polls].sort((a, b) => b.options.reduce((sum, option) => sum + option.votes.length, 0) - a.options.reduce((sum, option) => sum + option.votes.length, 0))
    : polls;

  return (
    <main>
      <Screen title="Poll results" subtitle="Fun prompts only" back={{ href: "/home" }}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex gap-2 text-sm font-extrabold">
            {[["popular", "Popular"], ["recent", "Recent"], ["yours", "Your polls"]].map(([id, label]) => (
              <Link key={id} href={`/polls?tab=${id}`} className={`rounded-full px-3 py-1 ${tab === id ? "bg-ink text-white" : "bg-lemon-100"}`}>{label}</Link>
            ))}
          </div>
        </div>
        <div className="px-4 pb-2">
          <Link href="/polls/new" className="btn-lemon">New poll</Link>
        </div>
        <ul className="space-y-3 px-4 pb-6">
          {ranked.map((poll) => {
            const votes = poll.options.reduce((sum, option) => sum + option.votes.length, 0);
            return (
              <li key={poll.id}>
                <Link href={`/polls/${poll.id}`} className="card block">
                  <p className="text-sm font-extrabold">{poll.author.displayName}</p>
                  <p className="text-xs font-bold text-ink/50">{formatWhen(poll.createdAt)}</p>
                  <h2 className="mt-1 font-extrabold">{poll.question}</h2>
                  <p className="mt-1 text-xs font-bold text-ink/60">{plural(votes, "vote")} · {plural(poll.comments.length, "comment")} · {poll.category}</p>
                </Link>
              </li>
            );
          })}
          {ranked.length === 0 ? <li className="text-sm font-bold">No polls yet.</li> : null}
        </ul>
      </Screen>
    </main>
  );
}
