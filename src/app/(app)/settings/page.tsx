import { Flash, Screen } from "@/components/chrome";
import { isUnder16 } from "@/lib/age";
import { getPrisma } from "@/lib/prisma";
import { deleteMe, resendConsent, submitSettings, submitUnblock, triggerAutopilot } from "@/server/app-actions";
import { getCurrentUser } from "@/server/session";

export const dynamic = "force-dynamic";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string }> }) {
  const query = await searchParams;
  const user = await getCurrentUser();
  if (!user) return null;
  const under = isUnder16(user.dateOfBirth);
  const blocks = await getPrisma().block.findMany({ where: { blockerId: user.id }, include: { blocked: true } });
  const hours = Array.from({ length: 24 }, (_, hour) => hour);

  return (
    <main>
      <Screen title="Settings" subtitle="Data controls" back={{ href: "/profile" }}>
        <Flash error={query.error} notice={query.notice} />
        <form action={submitSettings} className="space-y-3 px-4 py-4">
          <label className="flex gap-2 text-sm font-bold"><input type="checkbox" name="directoryOptIn" defaultChecked={user.directoryOptIn} /> Show me in the directory</label>
          <label className="flex gap-2 text-sm font-bold"><input type="checkbox" name="allowAnonymous" defaultChecked={user.allowAnonymous} /> Allow anonymous gifts</label>
          <label className="flex gap-2 text-sm font-bold"><input type="checkbox" name="autopilotOptIn" defaultChecked={user.autopilotOptIn} /> Overnight autopilot</label>
          <label className="flex gap-2 text-sm font-bold"><input type="checkbox" name="memoryOptIn" defaultChecked={user.memoryOptIn} /> Avatar memory</label>
          <div className="grid grid-cols-2 gap-2">
            <label className="label">Sleep starts
              <select className="field" name="sleepStartHour" defaultValue={user.sleepStartHour}>
                {hours.map((hour) => <option key={hour} value={hour}>{hour}:00</option>)}
              </select>
            </label>
            <label className="label">Sleep ends
              <select className="field" name="sleepEndHour" defaultValue={user.sleepEndHour}>
                {hours.map((hour) => <option key={hour} value={hour}>{hour}:00</option>)}
              </select>
            </label>
          </div>
          <label className="label">Daily spend cap {under ? "(0–80, gifts and boosts)" : "(blank + unlimited below)"}
            <input className="field" name="dailySpendCap" type="number" min={0} max={under ? 80 : 5000} defaultValue={user.dailySpendCap ?? (under ? 40 : "")} />
          </label>
          {!under ? <label className="flex gap-2 text-sm font-bold"><input type="checkbox" name="unlimitedCap" defaultChecked={user.dailySpendCap === null} /> No spend cap</label> : null}
          <button className="btn-lemon" type="submit">Save</button>
        </form>
        {under && !user.parentalConsentAt ? (
          <form action={resendConsent} className="px-4">
            <button className="btn-ghost w-full" type="submit">Resend parent approval</button>
          </form>
        ) : null}
        {process.env.NODE_ENV !== "production" ? (
          <form action={triggerAutopilot} className="px-4 py-3">
            <button className="btn-ghost w-full" type="submit">Run autopilot now (dev)</button>
          </form>
        ) : null}
        <section className="px-4 py-2">
          <h2 className="font-extrabold">Blocked</h2>
          <ul className="mt-2 space-y-2">
            {blocks.length === 0 ? <li className="text-sm font-bold text-ink/60">Nobody.</li> : null}
            {blocks.map((block) => (
              <li key={block.id} className="flex items-center justify-between text-sm font-bold">
                <span>{block.blocked.displayName}</span>
                <form action={submitUnblock}>
                  <input type="hidden" name="userId" value={block.blockedId} />
                  <button className="btn-ghost" type="submit">Unblock</button>
                </form>
              </li>
            ))}
          </ul>
        </section>
        <section className="space-y-2 px-4 py-4">
          <a className="btn-ghost w-full" href="/api/me/export">Export my data</a>
          <form action={deleteMe} className="card space-y-2">
            <p className="text-sm font-bold">Delete account and data. Type DELETE.</p>
            <input className="field" name="confirm" placeholder="DELETE" />
            <button className="btn-solid w-full" type="submit">Delete my account</button>
          </form>
        </section>
      </Screen>
    </main>
  );
}
