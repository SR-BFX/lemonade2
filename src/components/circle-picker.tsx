import { formatGrade } from "@/lib/catalog";
import { submitCircle } from "@/server/app-actions";

type Mate = { id: string; displayName: string | null; grade: number | null; clubs: string; avatarEmoji: string };

export function CirclePicker({
  mates,
  friendIds,
  crushIds,
  romantic,
  finish,
}: {
  mates: Mate[];
  friendIds: string[];
  crushIds: string[];
  romantic: boolean;
  finish: boolean;
}) {
  const friends = new Set(friendIds);
  const crushes = new Set(crushIds);
  return (
    <form action={submitCircle} className="space-y-3 px-4 py-4">
      {finish ? <input type="hidden" name="finish" value="1" /> : null}
      <p className="text-sm font-bold text-ink/70">
        Choose up to 7 friends{romantic ? " and up to 3 crushes" : ""}. Crushes stay private and are only revealed if you both choose each other.
      </p>
      {!romantic ? (
        <p className="rounded-2xl bg-lemon-100 px-3 py-2 text-sm font-bold">Crushes unlock at 16. Friends are open now.</p>
      ) : null}
      {mates.length === 0 ? (
        <p className="card text-sm font-bold">No classmates have joined and opted in yet. Share an invite from your profile after this step.</p>
      ) : (
        <ul className="space-y-2">
          {mates.map((mate) => (
            <li key={mate.id} className="card flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-lemon-100 text-xl">{mate.avatarEmoji}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-extrabold">{mate.displayName}</span>
                <span className="block text-xs font-bold text-ink/60">
                  {mate.grade ? formatGrade(mate.grade) : ""} {mate.clubs ? `· ${mate.clubs}` : ""}
                </span>
              </span>
              <label className="text-xs font-extrabold">
                <input type="checkbox" name="friendIds" value={mate.id} defaultChecked={friends.has(mate.id)} className="mr-1" />
                Friend
              </label>
              {romantic ? (
                <label className="text-xs font-extrabold text-blush">
                  <input type="checkbox" name="crushIds" value={mate.id} defaultChecked={crushes.has(mate.id)} className="mr-1" />
                  Crush
                </label>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <button className="btn-lemon" type="submit">
        {finish ? "Save selections" : "Save"}
      </button>
    </form>
  );
}
