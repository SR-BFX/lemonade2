import { notFound } from "next/navigation";
import { Flash, Screen } from "@/components/chrome";
import { formatWhen, plural } from "@/lib/format";
import { getPrisma } from "@/lib/prisma";
import { submitComment, submitVote } from "@/server/app-actions";
import { getCurrentUser } from "@/server/session";

export const dynamic = "force-dynamic";

export default async function PollPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; notice?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const user = await getCurrentUser();
  if (!user) return null;
  const poll = await getPrisma().poll.findUnique({
    where: { id },
    include: { author: true, options: { include: { votes: true, user: true } }, comments: { include: { user: true }, orderBy: { createdAt: "asc" } } },
  });
  if (!poll || poll.schoolId !== user.schoolId) notFound();
  const total = poll.options.reduce((sum, option) => sum + option.votes.length, 0);
  const mine = poll.options.find((option) => option.votes.some((vote) => vote.userId === user.id));

  return (
    <main>
      <Screen title="Poll" back={{ href: "/polls" }}>
        <Flash error={query.error} notice={query.notice} />
        <article className="px-4 py-4">
          <p className="text-sm font-extrabold">{poll.author.displayName}</p>
          <p className="text-xs font-bold text-ink/50">{formatWhen(poll.createdAt)} · {poll.category}</p>
          <h2 className="mt-1 text-xl font-extrabold">{poll.question}</h2>
          <p className="text-xs font-bold text-ink/60">{plural(total, "vote")} · {plural(poll.comments.length, "comment")}</p>
          <ul className="mt-3 space-y-2">
            {poll.options.map((option) => {
              const pct = total ? Math.round((option.votes.length / total) * 100) : 0;
              return (
                <li key={option.id}>
                  <form action={submitVote}>
                    <input type="hidden" name="pollId" value={poll.id} />
                    <input type="hidden" name="optionId" value={option.id} />
                    <button type="submit" className="w-full text-left" disabled={Boolean(mine)}>
                      <span className="flex justify-between text-sm font-extrabold">
                        <span>{option.label}{mine?.id === option.id ? " · you" : ""}</span>
                        <span>{pct}%</span>
                      </span>
                      <span className="mt-1 block h-3 overflow-hidden rounded-full bg-lemon-100">
                        <span className="block h-full bg-lemon-300" style={{ width: `${pct}%` }} />
                      </span>
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
          <h3 id="comments" className="mt-5 font-extrabold">Comments</h3>
          <ul className="mt-2 space-y-2">
            {poll.comments.map((comment) => (
              <li key={comment.id} className="rounded-2xl bg-lemon-50 px-3 py-2 text-sm">
                <b>{comment.user.displayName}</b> {comment.body}
              </li>
            ))}
          </ul>
          <form action={submitComment} className="mt-3 flex gap-2">
            <input type="hidden" name="pollId" value={poll.id} />
            <input className="field" name="body" placeholder="Kind comments only" />
            <button className="btn-solid" type="submit">Send</button>
          </form>
        </article>
      </Screen>
    </main>
  );
}
