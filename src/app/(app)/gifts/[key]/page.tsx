import { notFound } from "next/navigation";
import { Flash, Screen } from "@/components/chrome";
import { giftByKey } from "@/lib/catalog";
import { ageOf } from "@/lib/economy";
import { discoverableClassmates } from "@/lib/eligibility";
import { submitGift } from "@/server/app-actions";
import { getCurrentUser } from "@/server/session";

export const dynamic = "force-dynamic";

export default async function SendGiftPage({ params, searchParams }: { params: Promise<{ key: string }>; searchParams: Promise<{ error?: string }> }) {
  const { key } = await params;
  const query = await searchParams;
  const user = await getCurrentUser();
  if (!user) return null;
  const gift = giftByKey(key);
  if (!gift || ageOf(user) < gift.minAge) notFound();
  const mates = await discoverableClassmates(user.id);

  return (
    <main>
      <Screen title="Send gift" subtitle={`${gift.emoji} ${gift.name}`} back={{ href: "/gifts" }}>
        <Flash error={query.error} />
        <form action={submitGift} className="space-y-3 px-4 py-4">
          <input type="hidden" name="giftKey" value={gift.key} />
          <p className="card text-sm font-bold">To send this, pick someone who joined your school and opted in. Cost: {gift.gems} gems. You have {user.gems}.</p>
          <label className="label">To
            <select className="field" name="toId" required>
              <option value="">Choose a classmate</option>
              {mates.map((mate) => (
                <option key={mate.id} value={mate.id}>{mate.displayName}</option>
              ))}
            </select>
          </label>
          {mates.length === 0 ? <p className="text-sm font-bold">No eligible classmates yet.</p> : null}
          <fieldset className="space-y-2">
            <legend className="label">How would you like to send this?</legend>
            <label className="card flex gap-2 text-sm font-bold">
              <input type="radio" name="mode" value="named" defaultChecked />
              <span><b>Send with your identity</b><br />They&apos;ll know it&apos;s from you. +10 friendship.</span>
            </label>
            <label className="card flex gap-2 text-sm font-bold">
              <input type="radio" name="mode" value="anonymous" />
              <span><b>Send anonymously</b><br />Secret admirer. They can turn this off, and you can send 3 a day. Moderators can still see the sender.</span>
            </label>
          </fieldset>
          <label className="label">Add a message (optional)
            <textarea className="field" name="message" maxLength={200} rows={2} />
          </label>
          <button className="btn-lemon" type="submit">Send gift · {gift.gems} gems</button>
        </form>
      </Screen>
    </main>
  );
}
