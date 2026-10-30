import Link from "next/link";
import { Screen } from "@/components/chrome";
import { levelFor } from "@/lib/catalog";
import { leaderboard, rankOf, type BoardPeriod } from "@/lib/leaderboard";
import { getCurrentUser } from "@/server/session";

export const dynamic = "force-dynamic";

const PERIODS: { id: BoardPeriod; label: string }[] = [
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "all", label: "All Time" },
];

export default async function LeaderboardPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const query = await searchParams;
  const user = await getCurrentUser();
  if (!user) return null;
  const period: BoardPeriod = query.period === "monthly" || query.period === "all" ? query.period : "weekly";
  const rows = await leaderboard(user.schoolId, period);
  const rank = rankOf(rows, user.id);
  const podium = rows.slice(0, 3);
  const order = podium.length >= 3 ? [podium[1], podium[0], podium[2]] : podium;

  return (
    <main>
      <Screen title="Leaderboard" subtitle={user.school.name}>
        <div className="flex gap-2 px-4 py-3 text-sm font-extrabold">
          {PERIODS.map((item) => (
            <Link key={item.id} href={`/leaderboard?period=${item.id}`} className={`rounded-full px-3 py-1 ${period === item.id ? "bg-ink text-white" : "bg-lemon-100"}`}>{item.label}</Link>
          ))}
        </div>
        <div className="flex items-end justify-center gap-2 px-4">
          {order.map((row, index) => (
            <div key={row.user.id} className={`card w-28 text-center ${index === 1 ? "mb-4 bg-lemon-100" : ""}`}>
              <div className="text-3xl">{row.user.avatarEmoji}</div>
              <div className="font-extrabold leading-tight">{row.user.displayName?.split(" ")[0]}</div>
              <div className="text-sm font-extrabold">{row.points.toLocaleString()}</div>
              <div className="text-xs font-bold">#{rows.findIndex((item) => item.user.id === row.user.id) + 1}</div>
            </div>
          ))}
        </div>
        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr className="text-xs font-extrabold text-ink/50">
              <th className="px-4 py-2">Rank</th>
              <th className="py-2">Player</th>
              <th className="px-4 py-2 text-right">Points</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.user.id} className={row.user.id === user.id ? "bg-lemon-100" : ""}>
                <td className="px-4 py-2 font-extrabold">{index + 1}</td>
                <td className="py-2">
                  <Link href={`/u/${row.user.handle}`} className="font-extrabold">{row.user.displayName}</Link>
                  <div className="text-xs font-bold text-ink/50">Overall level {levelFor(row.user.points)}</div>
                </td>
                <td className="px-4 py-2 text-right font-extrabold">{row.points.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <p className="px-4 py-6 text-sm font-bold">No points yet this period.</p> : null}
        <p className="px-4 py-4 text-sm font-extrabold">Your rank: {rank ? `#${rank}` : "unranked"}</p>
      </Screen>
    </main>
  );
}
