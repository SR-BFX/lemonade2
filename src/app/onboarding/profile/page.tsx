import { redirect } from "next/navigation";
import { AVATARS, formatGrade } from "@/lib/catalog";
import { Flash, Screen } from "@/components/chrome";
import { getCurrentUser } from "@/server/session";
import { submitProfile } from "@/server/app-actions";

export const dynamic = "force-dynamic";

export default async function ProfileSetupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const query = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (user.onboardingStep === "done") redirect("/profile");

  return (
    <main>
      <Screen title="Create your profile" subtitle="You fill this in. Nobody uploads it for you.">
        <Flash error={query.error} />
        <form action={submitProfile} className="space-y-3 px-4 py-4">
          <label className="label">Name
            <input className="field" name="displayName" defaultValue={user.displayName ?? ""} required />
          </label>
          <label className="label">Handle
            <input className="field" name="handle" defaultValue={user.handle ?? ""} placeholder="alexj_2024" required />
          </label>
          <label className="label">Grade
            <select className="field" name="grade" defaultValue={user.grade ?? 11}>
              {[9, 10, 11, 12].map((grade) => (
                <option key={grade} value={grade}>{formatGrade(grade)} grade</option>
              ))}
            </select>
          </label>
          <fieldset>
            <legend className="label">Avatar</legend>
            <div className="flex flex-wrap gap-2">
              {AVATARS.map((emoji) => (
                <label key={emoji} className="cursor-pointer text-2xl">
                  <input className="peer sr-only" type="radio" name="avatarEmoji" value={emoji} defaultChecked={emoji === (user.avatarEmoji || "🍋")} />
                  <span className="grid h-12 w-12 place-items-center rounded-2xl border-2 border-transparent peer-checked:border-ink peer-checked:bg-lemon-200">{emoji}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <label className="label">Traits <span className="font-semibold text-ink/50">(optional)</span>
            <input className="field" name="traits" defaultValue={user.traits} placeholder="Artistic · Kind" />
          </label>
          <label className="label">Clubs <span className="font-semibold text-ink/50">(optional)</span>
            <input className="field" name="clubs" defaultValue={user.clubs} placeholder="Debate Team" />
          </label>
          <label className="label">Bio <span className="font-semibold text-ink/50">(optional)</span>
            <textarea className="field" name="bio" defaultValue={user.bio} rows={2} />
          </label>
          <label className="flex items-start gap-2 text-sm font-bold">
            <input type="checkbox" name="directoryOptIn" className="mt-1" defaultChecked={user.directoryOptIn} />
            Show me in the student directory. Leave this off and classmates can&apos;t gift, poll, or include you in autopilot.
          </label>
          <label className="flex items-start gap-2 text-sm font-bold">
            <input type="checkbox" name="autopilotOptIn" className="mt-1" defaultChecked={user.autopilotOptIn} />
            Overnight autopilot (opt-in). While you&apos;re asleep, an agent can write feed events using classmates who joined.
          </label>
          <label className="flex items-start gap-2 text-sm font-bold">
            <input type="checkbox" name="memoryOptIn" className="mt-1" defaultChecked={user.memoryOptIn} />
            Avatar memory (opt-in). Save notes from my choices so the agent can follow them. I can read or delete them anytime.
          </label>
          <button className="btn-lemon" type="submit">Continue</button>
        </form>
      </Screen>
    </main>
  );
}
