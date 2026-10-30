import { Flash, Screen } from "@/components/chrome";
import { STORE_SKUS } from "@/lib/catalog";
import { money } from "@/lib/format";
import { ageOf } from "@/lib/economy";
import { submitPurchase } from "@/server/app-actions";
import { getCurrentUser } from "@/server/session";

export const dynamic = "force-dynamic";

export default async function StorePage({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string }> }) {
  const query = await searchParams;
  const user = await getCurrentUser();
  if (!user) return null;
  const under = ageOf(user) < 16;
  return (
    <main>
      <Screen title="Store" subtitle="Test checkout only" back={{ href: "/profile" }}>
        <Flash error={query.error} notice={query.notice} />
        <div className="space-y-3 px-4 py-4">
          <p className="card text-sm font-bold">Payments go through a stub provider. Nothing is charged. You have {user.gems} gems and {user.stars} stars.</p>
          {under ? <p className="rounded-2xl bg-lemon-100 px-3 py-2 text-sm font-bold">Under 16: one test purchase a day, and spending gems or stars still stops at your daily cap.</p> : null}
          <ul className="space-y-2">
            {STORE_SKUS.map((sku) => (
              <li key={sku.sku} className="card flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold">{sku.name}</p>
                  <p className="text-xs font-bold text-ink/60">{sku.detail}</p>
                  <p className="text-sm font-extrabold">{money(sku.amountCents)} test</p>
                </div>
                <form action={submitPurchase}>
                  <input type="hidden" name="sku" value={sku.sku} />
                  <button className="btn-solid" type="submit">Buy</button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      </Screen>
    </main>
  );
}
