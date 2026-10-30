import { Flash, Screen } from "@/components/chrome";
import { discoverableClassmates } from "@/lib/eligibility";
import { submitPoll } from "@/server/app-actions";
import { getCurrentUser } from "@/server/session";

export const dynamic = "force-dynamic";

export default async function NewPollPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const query = await searchParams;
  const user = await getCurrentUser();
  if (!user) return null;
  const mates = await discoverableClassmates(user.id);
  return (
    <main>
      <Screen title="New poll" subtitle="Positive, fun, and only about people who joined" back={{ href: "/polls" }}>
        <Flash error={query.error} />
        <form action={submitPoll} className="space-y-3 px-4 py-4">
          <label className="label">Question
            <input className="field" name="question" placeholder="Who would make the best class president?" required />
          </label>
          <label className="label">Category
            <select className="field" name="category" defaultValue="fun">
              <option value="fun">Fun</option>
              <option value="school">School</option>
              <option value="friends">Friends</option>
            </select>
          </label>
          <fieldset className="space-y-2">
            <legend className="label">Options</legend>
            <label className="text-sm font-bold"><input type="radio" name="optionKind" value="text" defaultChecked /> Text choices (one per line)</label>
            <textarea className="field" name="textOptions" rows={4} placeholder={"Pizza line\nTaco window"} />
            <label className="text-sm font-bold"><input type="radio" name="optionKind" value="members" /> Classmates who joined</label>
            <div className="card max-h-48 space-y-1 overflow-auto">
              {mates.map((mate) => (
                <label key={mate.id} className="block text-sm font-bold">
                  <input type="checkbox" name="memberIds" value={mate.id} className="mr-2" />
                  {mate.displayName}
                </label>
              ))}
            </div>
          </fieldset>
          <p className="text-xs font-bold text-ink/60">No teachers, staff, or anyone who hasn&apos;t verified their own school email.</p>
          <button className="btn-lemon" type="submit">Post poll</button>
        </form>
      </Screen>
    </main>
  );
}
