import Link from "next/link";
import { Flash, Screen } from "@/components/chrome";
import { achievementsFor } from "@/lib/achievements";
import { ageOf } from "@/lib/economy";
import { formatGrade, levelFor } from "@/lib/catalog";
import { leaderboard, rankOf } from "@/lib/leaderboard";
import { mutualCrushIds } from "@/lib/social";
import { getPrisma } from "@/lib/prisma";
import { logout } from "@/server/auth-actions";
import { getCurrentUser } from "@/server/session";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  const query = await searchParams;
  const user = await getCurrentUser();
  if (!user) return null;
  const prisma = getPrisma();
  const [board, gifts, friends, mentions, votes, achievements, crushes, mutual, boost] = await Promise.all([
    leaderboard(user.schoolId, "all"),
    prisma.giftSend.count({ where: { fromId: user.id } }),
    prisma.friendship.count({ where: { userId: user.id } }),
    prisma.pollOption.count({ where: { userId: user.id } }),
    prisma.pollVote.count({ where: { userId: user.id } }),
    achievementsFor(user.id),
    prisma.crush.findMany({ where: { userId: user.id }, include: { crush: true } }),
    mutualCrushIds(user.id),
    prisma.profileBoost.findFirst({ where: { userId: user.id, endsAt: { gt: new Date() } }, orderBy: { endsAt: "desc" } }),
  ]);
  const rank = rankOf(board, user.id);
  const mutualSet = new Set(mutual);

  return (
    <main>
      <Screen title="Profile">
        <Flash error={query.error} notice={query.notice} />
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-lemon-200 text-3xl">{user.avatarEmoji}</div>
            <div>
              <h2 className="text-xl font-extrabold">{user.displayName}</h2>
              <p className="font-bold text-ink/60">@{user.handle}</p>
              {boost ? <p className="text-xs font-extrabold text-leaf">Boosted until {boost.endsAt.toLocaleString()}</p> : null}
            </div>
          </div>
          <div className="mt-4 flex rounded-3xl border-2 border-lemon-200 py-3">
            <Stat value={user.points.toLocaleString()} label="Points" />
            <Stat value={rank ? `#${rank}` : "–"} label="Rank" />
            <Stat value={user.streak} label="Day streak" />
          </div>
          <p className="mt-2 text-xs font-bold text-ink/50">Level {levelFor(user.points)} · {user.gems} gems · {user.stars} stars</p>
          <section className="mt-4">
            <h3 className="font-extrabold">Personal information</h3>
            <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <Info label="Age" value={`${ageOf(user)} years old`} />
              <Info label="School" value={user.school.name} />
              <Info label="Grade" value={user.grade ? `${formatGrade(user.grade)} grade` : "—"} />
              <Info label="Joined" value={user.createdAt.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" })} />
            </dl>
            {user.bio ? <p className="mt-2 text-sm font-semibold">{user.bio}</p> : null}
          </section>
          <section className="mt-4">
            <h3 className="font-extrabold">Activity stats</h3>
            <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <Info label="Polls participated" value={String(votes)} />
              <Info label="Gifts sent" value={String(gifts)} />
              <Info label="Friends" value={String(friends)} />
              <Info label="Times mentioned" value={String(mentions)} />
            </dl>
          </section>
          <section className="mt-4">
            <h3 className="font-extrabold">Recent achievements</h3>
            <ul className="mt-2 space-y-2">
              {achievements.length === 0 ? <li className="text-sm font-bold text-ink/60">They show up when you earn them.</li> : null}
              {achievements.map((item) => (
                <li key={item.title} className="card">
                  <p className="font-extrabold">{item.title}</p>
                  <p className="text-xs font-bold text-ink/60">{item.detail}</p>
                </li>
              ))}
            </ul>
          </section>
          {crushes.length ? (
            <section className="mt-4">
              <h3 className="font-extrabold">Crushes · private</h3>
              <ul className="mt-2 space-y-1 text-sm font-bold">
                {crushes.map((row) => (
                  <li key={row.id}>{row.crush.displayName} · {mutualSet.has(row.crushId) ? "mutual" : "only you can see this"}</li>
                ))}
              </ul>
            </section>
          ) : null}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link className="btn-ghost" href="/friends">Friends</Link>
            <Link className="btn-ghost" href="/boost">Boost</Link>
            <Link className="btn-ghost" href="/store">Store</Link>
            <Link className="btn-ghost" href="/memory">Memory</Link>
            <Link className="btn-ghost" href="/invite">Invite</Link>
            <Link className="btn-ghost" href="/ambassador">Ambassador</Link>
            <Link className="btn-ghost" href="/settings">Settings</Link>
            <Link className="btn-ghost" href="/privacy">Privacy</Link>
            {user.role === "moderator" ? <Link className="btn-ghost" href="/mod">Mod queue</Link> : null}
          </div>
          <form action={logout} className="mt-4">
            <button className="btn-solid w-full" type="submit">Log out</button>
          </form>
        </div>
      </Screen>
    </main>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex-1 text-center">
      <div className="text-lg font-extrabold">{value}</div>
      <div className="text-[11px] font-bold text-ink/60">{label}</div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-lemon-50 px-3 py-2">
      <dt className="text-[11px] font-bold text-ink/50">{label}</dt>
      <dd className="font-extrabold">{value}</dd>
    </div>
  );
}
