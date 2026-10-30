import { Flash, Screen } from "@/components/chrome";
import { BOOSTS } from "@/lib/catalog";
import { ageOf } from "@/lib/economy";
import { submitBoost } from "@/server/app-actions";
import { getCurrentUser } from "@/server/session";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function BoostPage({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string }> }) {
  const query = await searchParams;
  const user = await getCurrentUser();
  if (!user) return null;
  const under = ageOf(user) < 16;
  return (
    <main>
      <Screen title="Boost profile" subtitle="Get noticed by students who already joined" back={{ href: "/profile" }}>
        <Flash error={query.error} notice={query.notice} />
        <div className="space-y-3 px-4 py-4">
          <ul className="card space-y-2 text-sm font-bold">
            <li>Your profile sorts higher for classmates at your school.</li>
            <li>Featured boosts show a badge on your profile.</li>
            <li>Basic and Premium last 24 hours. Super lasts 48.</li>
          </ul>
          <form action={submitBoost} className="space-y-2">
            {BOOSTS.map((boost) => (
              <label key={boost.tier} className="card block">
                <span className="flex items-center justify-between">
                  <span className="font-extrabold">{boost.name} {boost.popular && !under ? <span className="rounded-full bg-lemon-300 px-2 py-0.5 text-xs">Popular</span> : null}</span>
                  <span>{boost.stars} ⭐</span>
                </span>
                <span className="mt-1 block text-sm font-semibold text-ink/70">{boost.blurb}</span>
                <input className="mt-2" type="radio" name="tier" value={boost.tier} defaultChecked={boost.tier === "basic"} />
              </label>
            ))}
            <p className="text-sm font-extrabold">Your stars: {user.stars} ⭐</p>
            {under ? <p className="text-sm font-bold">Under 16, boosts count toward your daily spend cap. There&apos;s no timer pushing you to buy more.</p> : <p className="text-xs font-semibold text-ink/60">Stars also come from being active. The store sells test packs.</p>}
            <button className="btn-lemon" type="submit">Boost my profile</button>
          </form>
          <Link href="/store" className="btn-ghost w-full">Star store</Link>
          <p className="text-center text-xs font-bold text-ink/50">By boosting, you agree to the <Link href="/terms" className="underline">community guidelines</Link>.</p>
        </div>
      </Screen>
    </main>
  );
}
