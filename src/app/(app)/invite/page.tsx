import { CopyButton } from "@/components/copy-button";
import { Screen } from "@/components/chrome";
import { countDiscoverable } from "@/lib/eligibility";
import { appUrl } from "@/lib/tokens";
import { getPrisma } from "@/lib/prisma";
import { getCurrentUser } from "@/server/session";

export const dynamic = "force-dynamic";

export default async function InvitePage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const invite = await getPrisma().invite.findFirst({ where: { inviterId: user.id } });
  const here = await countDiscoverable(user.schoolId);
  const link = invite ? `${appUrl()}/join/${invite.code}` : "";
  return (
    <main>
      <Screen title="Invite classmates" subtitle={user.school.name} back={{ href: "/profile" }}>
        <div className="space-y-3 px-4 py-4">
          <p className="text-lg font-extrabold">
            {here === 0
              ? `You're the first from ${user.school.name}.`
              : `${here} student${here === 1 ? "" : "s"} from ${user.school.name} ${here === 1 ? "is" : "are"} already here.`}
          </p>
          <p className="text-sm font-semibold">Share a link. They still verify their own school email. This does not add anyone for them.</p>
          {invite ? (
            <div className="card">
              <p className="text-xs font-extrabold text-ink/50">Code</p>
              <p className="text-2xl font-extrabold tracking-widest">{invite.code}</p>
              <p className="mt-1 break-all text-sm font-bold">{link}</p>
              <p className="text-xs font-bold text-ink/50">{invite.uses} joined with this code</p>
              <div className="mt-3"><CopyButton value={link} label="Copy link" /></div>
            </div>
          ) : <p>Finish your profile to get a code.</p>}
        </div>
      </Screen>
    </main>
  );
}
