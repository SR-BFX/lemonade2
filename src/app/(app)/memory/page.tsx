import { Flash, Screen } from "@/components/chrome";
import { getPrisma } from "@/lib/prisma";
import { deleteMemory } from "@/server/app-actions";
import { getCurrentUser } from "@/server/session";

export const dynamic = "force-dynamic";

export default async function MemoryPage({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  const query = await searchParams;
  const user = await getCurrentUser();
  if (!user) return null;
  const memories = await getPrisma().avatarMemory.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  const kinds = ["preference", "social", "interest"];
  return (
    <main>
      <Screen title="Avatar memory" subtitle={user.memoryOptIn ? "On — choices can add notes" : "Off — nothing new will be saved"} back={{ href: "/profile" }}>
        <Flash notice={query.notice} error={query.error} />
        <div className="px-4 py-4">
          <p className="text-sm font-semibold">These notes steer overnight events when memory and autopilot are both on. Delete any of them. They are not shared with classmates.</p>
          {kinds.map((kind) => {
            const rows = memories.filter((memory) => memory.kind === kind);
            if (!rows.length) return null;
            return (
              <section key={kind} className="mt-4">
                <h2 className="font-extrabold capitalize">{kind}</h2>
                <ul className="mt-2 space-y-2">
                  {rows.map((memory) => (
                    <li key={memory.id} className="card flex items-start justify-between gap-2">
                      <span>
                        <span className="block text-sm font-bold">{memory.content}</span>
                        <span className="text-xs font-semibold text-ink/50">From {memory.source}</span>
                      </span>
                      <form action={deleteMemory}>
                        <input type="hidden" name="id" value={memory.id} />
                        <button className="btn-ghost" type="submit">Delete</button>
                      </form>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
          {memories.length === 0 ? <p className="mt-4 text-sm font-bold">No notes yet.</p> : (
            <form action={deleteMemory} className="mt-4">
              <input type="hidden" name="id" value="all" />
              <button className="btn-solid w-full" type="submit">Delete all memory</button>
            </form>
          )}
        </div>
      </Screen>
    </main>
  );
}
