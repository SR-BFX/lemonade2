import { Flash, Screen } from "@/components/chrome";
import { submitCode } from "@/server/auth-actions";

export const dynamic = "force-dynamic";

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ email?: string; error?: string }> }) {
  const query = await searchParams;
  const email = query.email ?? "";
  return (
    <main>
      <Screen title="Enter your code" subtitle={email || "Check your school inbox"} back={{ href: "/onboarding/school", label: "Start over" }}>
        <Flash error={query.error} />
        <form action={submitCode} className="space-y-3 px-4 py-4">
          <input type="hidden" name="email" value={email} />
          <label className="label">6-digit code
            <input className="field tracking-[0.4em]" name="code" inputMode="numeric" pattern="\d{6}" minLength={6} maxLength={6} required />
          </label>
          <button className="btn-lemon" type="submit">Verify</button>
          <p className="text-xs font-semibold text-ink/60">Dev tip: open /dev/mail if you don&apos;t have an inbox hooked up. The code is also printed in the terminal.</p>
        </form>
      </Screen>
    </main>
  );
}
