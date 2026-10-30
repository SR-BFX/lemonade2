import Link from "next/link";
import { Screen } from "@/components/chrome";

export default function PrivacyPage() {
  return (
    <main>
      <Screen title="Privacy" subtitle="Plain language" back={{ href: "/" }}>
        <article className="space-y-4 px-5 py-4 text-sm font-semibold leading-relaxed">
          <p>Lemonade is a school life sim. A student exists here only after they sign up with their own school email and enter the code we send. We don&apos;t buy lists, scrape directories, or let ambassadors upload rosters.</p>
          <h2 className="text-base font-extrabold">What we collect</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>School email, date of birth, and a parent email if you&apos;re under 16.</li>
            <li>The profile you write: name, handle, grade, avatar, clubs, bio.</li>
            <li>Friends you pick, and crushes if you&apos;re 16 or older. Crushes stay private unless the other person (also 16+) picks you too.</li>
            <li>Gifts, poll votes, comments, blocks, and reports.</li>
            <li>Avatar memory, only if you turn it on: short notes taken from choices you make.</li>
            <li>Gems, stars, and test-checkout records. The store uses a stub and does not charge a real card.</li>
          </ul>
          <h2 className="text-base font-extrabold">How the avatar learns</h2>
          <p>Autopilot and avatar memory are off until you opt in. Memory is a list you can open and delete. When autopilot runs during your sleep window, it may write feed events about you and classmates who joined, verified their email, opted into the directory, and aren&apos;t blocked. If an OpenAI-compatible key is set, event text can be drafted by that model from your first name, your memory notes, and those classmates. If no key is set, a built-in rule list writes the events instead. People who haven&apos;t joined are never sent to the model and never appear as targets.</p>
          <h2 className="text-base font-extrabold">Under 16</h2>
          <p>A parent approves by email before the profile is visible or autopilot can run. Romantic gifts, the Kiss gesture, and crushes stay 16+. There&apos;s a daily spend cap (80 max) so the store can&apos;t push open-ended spending.</p>
          <h2 className="text-base font-extrabold">Anonymous gifts</h2>
          <p>You can turn anonymous gifts off. Classmates can still send gifts with their name. Anonymous sends are rate-limited. Moderators can see the real sender and act on reports. Messages pass a basic kindness filter.</p>
          <h2 className="text-base font-extrabold">Your controls</h2>
          <p>Settings has the opt-in switches, the anonymous switch, the spend cap, export, and delete. Delete removes the account and the data tied to it, including memory, gifts, and events that name you.</p>
          <p>Counts in the app are real joined students, not a marketing number.</p>
          <Link href="/settings" className="btn-lemon">Open data controls</Link>
        </article>
      </Screen>
    </main>
  );
}
