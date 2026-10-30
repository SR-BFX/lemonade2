import { CirclePicker } from "@/components/circle-picker";
import { Flash, Screen } from "@/components/chrome";
import { discoverableClassmates, romanticAllowed } from "@/lib/eligibility";
import { getPrisma } from "@/lib/prisma";
import { getCurrentUser } from "@/server/session";

export const dynamic = "force-dynamic";

export default async function FriendsPage({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string }> }) {
  const query = await searchParams;
  const user = await getCurrentUser();
  if (!user) return null;
  const prisma = getPrisma();
  const [mates, friends, crushes] = await Promise.all([
    discoverableClassmates(user.id),
    prisma.friendship.findMany({ where: { userId: user.id } }),
    prisma.crush.findMany({ where: { userId: user.id } }),
  ]);
  return (
    <main>
      <Screen title="Friends & crushes" subtitle={`${friends.length}/7 friends${romanticAllowed(user) ? ` · ${crushes.length}/3 crushes` : ""}`} back={{ href: "/profile" }}>
        <Flash error={query.error} notice={query.notice} />
        <CirclePicker mates={mates} friendIds={friends.map((row) => row.friendId)} crushIds={crushes.map((row) => row.crushId)} romantic={romanticAllowed(user)} finish={false} />
      </Screen>
    </main>
  );
}
