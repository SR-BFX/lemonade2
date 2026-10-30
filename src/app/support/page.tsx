import { Flash, Screen } from "@/components/chrome";
import { submitSupport } from "@/server/app-actions";

export const dynamic = "force-dynamic";

export default async function SupportPage({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string }> }) {
  const query = await searchParams;
  return (
    <main>
      <Screen title="Contact support" back={{ href: "/" }}>
        <Flash error={query.error} notice={query.notice} />
        <form action={submitSupport} className="space-y-3 px-4 py-4">
          <label className="label">Email<input className="field" type="email" name="email" required /></label>
          <label className="label">How can we help?
            <textarea className="field" name="body" rows={4} required />
          </label>
          <button className="btn-lemon" type="submit">Send</button>
        </form>
      </Screen>
    </main>
  );
}
