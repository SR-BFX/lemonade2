import Link from "next/link";
import { notFound } from "next/navigation";
import { Flash, Screen } from "@/components/chrome";
import { parseChoices } from "@/lib/autopilot";
import { formatWhen } from "@/lib/format";
import { getPrisma } from "@/lib/prisma";
import { chooseAction } from "@/server/app-actions";
import { getCurrentUser } from "@/server/session";

export const dynamic = "force-dynamic";

export default async function EventPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; notice?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const user = await getCurrentUser();
  if (!user) return null;
  const event = await getPrisma().feedEvent.findUnique({ where: { id }, include: { people: true } });
  if (!event || event.userId !== user.id) notFound();
  const personId = event.people[0]?.userId;
  const person = personId ? await getPrisma().user.findUnique({ where: { id: personId } }) : null;
  const stat = person ? await getPrisma().socialStat.findUnique({ where: { userId_otherId: { userId: user.id, otherId: person.id } } }) : null;
  const choices = parseChoices(event.choices);
  const chosen = choices.find((choice) => choice.key === event.chosenKey);

  return (
    <main>
      <Screen title="Take action" back={{ href: "/home" }}>
        <Flash error={query.error} notice={query.notice} />
        <article className="px-4 py-4">
          <p className="text-3xl">{event.emoji}</p>
          <h2 className="text-xl font-extrabold">{event.title}</h2>
          <p className="text-xs font-extrabold text-ink/50">{formatWhen(event.createdAt)}</p>
          <p className="mt-2 text-sm font-semibold leading-relaxed">{event.body}</p>
          {person ? (
            <Link href={`/u/${person.handle}`} className="card mt-4 block">
              <p className="font-extrabold">{person.displayName}</p>
              <p className="text-sm font-bold text-ink/70">{person.traits || "Classmate"}</p>
              <p className="text-sm font-bold">{person.clubs || "No club listed"}</p>
              <p className="mt-1 text-sm font-extrabold">Friendship: {stat?.friendship ?? 20}% · Interest: {stat?.interest ?? "Low"}</p>
            </Link>
          ) : null}
          <h3 id="respond" className="mt-5 font-extrabold">How will you respond?</h3>
          {event.status !== "open" ? (
            <p className="mt-2 rounded-2xl bg-lemon-100 px-3 py-2 text-sm font-bold">You chose: {chosen?.label ?? "a response"}.</p>
          ) : choices.length === 0 ? (
            <p className="mt-2 text-sm font-bold">Nothing to decide here. It&apos;s already part of your day.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {choices.map((choice) => {
                const delta = choice.friendship ?? choice.reputation ?? 0;
                return (
                  <li key={choice.key}>
                    <form action={chooseAction}>
                      <input type="hidden" name="eventId" value={event.id} />
                      <input type="hidden" name="choiceKey" value={choice.key} />
                      <button className="card flex w-full items-center justify-between text-left" type="submit">
                        <span className="font-extrabold">{choice.label}</span>
                        {delta ? <span className={`rounded-full px-2 py-1 text-sm font-extrabold ${delta > 0 ? "bg-leaf/15 text-leaf" : "bg-blush/10 text-blush"}`}>{delta > 0 ? `+${delta}` : delta}</span> : null}
                      </button>
                    </form>
                  </li>
                );
              })}
            </ul>
          )}
        </article>
      </Screen>
    </main>
  );
}
