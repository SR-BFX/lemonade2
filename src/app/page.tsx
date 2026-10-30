import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/session";

export const dynamic = "force-dynamic";

const TILES = [
  { icon: "👫", title: "Connect with Friends", body: "Find classmates who actually joined" },
  { icon: "💕", title: "Discover Crushes", body: "See a match only if it's mutual, 16+" },
  { icon: "🏆", title: "Earn Recognition", body: "Reputation comes from real activity" },
  { icon: "🎁", title: "Send Gifts", body: "Spend gems on treats, not pressure" },
];

export default async function SplashPage() {
  const user = await getCurrentUser();
  if (user?.onboardingStep === "done") redirect("/home");
  if (user?.onboardingStep === "people") redirect("/onboarding/people");
  if (user?.onboardingStep === "profile") redirect("/onboarding/profile");

  return (
    <main className="px-5 pb-10 pt-10">
      <p className="text-center text-6xl" aria-hidden>🍋</p>
      <h1 className="mt-2 text-center text-4xl font-extrabold">Lemonade</h1>
      <p className="text-center text-lg font-bold text-ink/70">Sweet connections at school</p>
      <p className="mx-auto mt-3 w-fit rounded-full bg-ink px-3 py-1 text-sm font-extrabold text-lemon-200">Rule Your School</p>
      <ul className="mt-6 grid grid-cols-2 gap-3">
        {TILES.map((tile) => (
          <li key={tile.title} className="card">
            <div className="text-2xl">{tile.icon}</div>
            <h2 className="mt-1 text-sm font-extrabold leading-tight">{tile.title}</h2>
            <p className="mt-1 text-xs font-semibold text-ink/70">{tile.body}</p>
          </li>
        ))}
      </ul>
      <Link href="/onboarding/school" className="btn-lemon mt-6">Get Started</Link>
      <p className="mt-4 text-center text-xs font-bold text-ink/60">
        By continuing, you agree to our <Link href="/terms" className="underline">Terms of Service</Link> and{" "}
        <Link href="/privacy" className="underline">Privacy Policy</Link>.
      </p>
      <p className="mt-6 text-center text-lg tracking-widest" aria-hidden>🍋 ✨ 🍋 ✨ 🍋</p>
    </main>
  );
}
