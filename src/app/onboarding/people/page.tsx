import { redirect } from "next/navigation";
import { CirclePicker } from "@/components/circle-picker";
import { Flash, Screen } from "@/components/chrome";
import { discoverableClassmates, romanticAllowed } from "@/lib/eligibility";
import { getPrisma } from "@/lib/prisma";
import { getCurrentUser } from "@/server/session";

export const dynamic = "force-dynamic";

export default async function PeopleOnboarding({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const query = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (user.onboardingStep === "profile") redirect("/onboarding/profile");
  if (user.onboardingStep === "done") redirect("/friends");
  const [mates, friends, crushes] = await Promise.all([
    discoverableClassmates(user.id),
    getPrisma().friendship.findMany({ where: { userId: user.id } }),
    getPrisma().crush.findMany({ where: { userId: user.id } }),
  ]);
  return (
    <main>
      <Screen title="Select people" subtitle="Choose up to 7 friends and up to 3 crushes">
        <Flash error={query.error} />
        <CirclePicker
          mates={mates}
          friendIds={friends.map((row) => row.friendId)}
          crushIds={crushes.map((row) => row.crushId)}
          romantic={romanticAllowed(user)}
          finish
        />
      </Screen>
    </main>
  );
}
