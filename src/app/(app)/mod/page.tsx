import { notFound } from "next/navigation";
import { Flash, Screen } from "@/components/chrome";
import { moderationQueue } from "@/lib/moderation";
import { getPrisma } from "@/lib/prisma";
import { moderate } from "@/server/app-actions";
import { getCurrentUser } from "@/server/session";

export const dynamic = "force-dynamic";

export default async function ModPage({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string }> }) {
  const query = await searchParams;
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role !== "moderator") notFound();
  const [queue, requests] = await Promise.all([
    moderationQueue(),
    getPrisma().schoolRequest.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
  ]);
  return (
    <main>
      <Screen title="Moderation" subtitle="True senders are visible here" back={{ href: "/profile" }}>
        <Flash error={query.error} notice={query.notice} />
        <ul className="space-y-3 px-4 py-4">
          {queue.length === 0 ? <li className="text-sm font-bold">No open reports.</li> : null}
          {queue.map(({ report, sender, summary }) => (
            <li key={report.id} className="card text-sm">
              <p className="font-extrabold">{report.targetType} · {summary}</p>
              <p>Reason: {report.reason}</p>
              <p>Reporter: {report.reporter.displayName} ({report.reporter.email})</p>
              {sender ? <p className="font-extrabold">True sender: {sender.displayName} · {sender.email}</p> : null}
              <div className="mt-2 flex flex-wrap gap-2">
                {(["dismiss", "remove", "suspend"] as const).map((action) => (
                  <form key={action} action={moderate}>
                    <input type="hidden" name="reportId" value={report.id} />
                    <input type="hidden" name="action" value={action} />
                    <button className="btn-ghost" type="submit">{action}</button>
                  </form>
                ))}
              </div>
            </li>
          ))}
        </ul>
        <section className="px-4 pb-6">
          <h2 className="font-extrabold">School requests</h2>
          <ul className="mt-2 space-y-2">
            {requests.length === 0 ? <li className="text-sm font-bold">None.</li> : null}
            {requests.map((request) => (
              <li key={request.id} className="card text-sm font-bold">{request.name} · {request.city} · @{request.domain}<br />{request.contactEmail}</li>
            ))}
          </ul>
        </section>
      </Screen>
    </main>
  );
}
