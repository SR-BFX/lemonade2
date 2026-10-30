import Link from "next/link";
import { Flash, Screen } from "@/components/chrome";
import { GIFTS, giftByKey, type GiftTab } from "@/lib/catalog";
import { ageOf } from "@/lib/economy";
import { romanticAllowed } from "@/lib/eligibility";
import { getPrisma } from "@/lib/prisma";
import { giftView } from "@/lib/gifts";
import { submitReport } from "@/server/app-actions";
import { getCurrentUser } from "@/server/session";

export const dynamic = "force-dynamic";

const TABS: { id: GiftTab | "all"; label: string }[] = [
  { id: "crush", label: "💕 For Crush" },
  { id: "friends", label: "👫 Friends" },
  { id: "food", label: "🍕 Food" },
  { id: "premium", label: "✨ Premium" },
];

export default async function GiftsPage({ searchParams }: { searchParams: Promise<{ tab?: string; error?: string; notice?: string }> }) {
  const query = await searchParams;
  const user = await getCurrentUser();
  if (!user) return null;
  const age = ageOf(user);
  const tab = (query.tab as GiftTab | undefined) ?? undefined;
  const gifts = GIFTS.filter((gift) => age >= gift.minAge && (!tab || gift.tabs.includes(tab)));
  const sections = [
    { id: "romantic", title: "💕 Romantic gifts", items: gifts.filter((gift) => gift.section === "romantic") },
    { id: "treats", title: "🍫 Sweet treats", items: gifts.filter((gift) => gift.section === "treats") },
    { id: "gestures", title: "✨ Special gestures", items: gifts.filter((gift) => gift.section === "gestures") },
  ].filter((section) => section.items.length);
  const inbox = await getPrisma().giftSend.findMany({
    where: { toId: user.id },
    orderBy: { createdAt: "desc" },
    take: 8,
    include: { from: true },
  });

  return (
    <main>
      <Screen title="Choose a gift" subtitle={`${user.gems} gems`}>
        <Flash error={query.error} notice={query.notice} />
        <div className="flex gap-2 overflow-x-auto px-4 py-3 text-sm font-extrabold">
          {TABS.map((item) => (
            <Link key={item.id} href={item.id === "crush" && !romanticAllowed(user) ? "/gifts?tab=friends" : `/gifts?tab=${item.id}`} className={`whitespace-nowrap rounded-full px-3 py-1 ${query.tab === item.id ? "bg-ink text-white" : "bg-lemon-100"}`}>
              {item.label}
            </Link>
          ))}
        </div>
        {!romanticAllowed(user) ? (
          <p className="mx-4 mb-3 rounded-2xl bg-lemon-100 px-3 py-2 text-sm font-bold">Romantic gifts and Kiss are 16+. High Five, Hug, Wink, and treats are here instead.</p>
        ) : null}
        {sections.map((section) => (
          <section key={section.id} className="px-4 pb-4">
            <h2 className="mb-2 font-extrabold">{section.title}</h2>
            <ul className="grid grid-cols-2 gap-2">
              {section.items.map((gift) => (
                <li key={gift.key}>
                  <Link href={`/gifts/${gift.key}`} className="card block h-full">
                    <span className="text-3xl">{gift.emoji}</span>
                    <span className="mt-1 block font-extrabold">{gift.name}</span>
                    <span className="text-sm font-extrabold text-ink/70">{gift.gems} gems</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
        <section className="px-4 pb-6">
          <h2 className="mb-2 font-extrabold">Received</h2>
          <ul className="space-y-2">
            {inbox.length === 0 ? <li className="text-sm font-bold text-ink/60">No gifts yet.</li> : null}
            {inbox.map((gift) => {
              const view = giftView(gift, user.id, user.role === "moderator");
              const def = giftByKey(gift.giftKey);
              return (
                <li key={gift.id} className="card">
                  <p className="font-extrabold">{def?.emoji} {def?.name ?? gift.giftKey}</p>
                  <p className="text-sm font-bold">{view.showSender ? `From ${gift.from.displayName}` : "From a secret admirer"}</p>
                  {gift.message ? <p className="text-sm">{gift.message}</p> : null}
                  <form action={submitReport} className="mt-2 flex gap-2">
                    <input type="hidden" name="targetType" value="gift" />
                    <input type="hidden" name="targetId" value={gift.id} />
                    <input type="hidden" name="back" value="/gifts" />
                    <input className="field" name="reason" placeholder="Report reason" />
                    <button className="btn-ghost" type="submit">Report</button>
                  </form>
                </li>
              );
            })}
          </ul>
        </section>
      </Screen>
    </main>
  );
}
