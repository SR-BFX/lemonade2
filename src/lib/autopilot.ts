import type { User } from "@prisma/client";
import { canRunAutopilot, discoverableClassmates, isAsleep, romanticAllowed } from "./eligibility";
import { getPrisma } from "./prisma";
import { bumpStat, remember } from "./social";

export type Choice = {
  key: string;
  label: string;
  friendship?: number;
  reputation?: number;
  interest?: "Low" | "Medium" | "High";
  memory?: string;
};

export type DraftEvent = {
  emoji: string;
  title: string;
  body: string;
  personIds: string[];
  romantic: boolean;
  choices: Choice[];
};

type Mate = { id: string; displayName: string; clubs: string };

const PERSONAL: Array<() => DraftEvent> = [
  () => ({
    emoji: "👋",
    title: "You got kicked out of class",
    body: "A laugh landed at the wrong second and you were sent to the hallway. It's quiet out here. How do you play the rest of the period?",
    personIds: [],
    romantic: false,
    choices: [
      { key: "notes", label: "Use the time to rewrite your notes", reputation: 6, memory: "Resets quickly after an awkward moment" },
      { key: "joke", label: "Own the joke when you walk back in", reputation: 4, friendship: 2, memory: "Uses humor to smooth things over" },
      { key: "quiet", label: "Slip back in quietly", reputation: 2, memory: "Prefers a low-key recovery" },
    ],
  }),
  () => ({
    emoji: "📌",
    title: "A club-fair flyer was on your locker",
    body: "Somebody pinned a flyer for tomorrow's club fair to your locker. No names, just a doodle of a lemon. Do you go?",
    personIds: [],
    romantic: false,
    choices: [
      { key: "go", label: "Stop by the club fair", reputation: 5, memory: "Curious about clubs" },
      { key: "skip", label: "Leave the flyer for someone else", reputation: 0, memory: "Protects their free periods" },
    ],
  }),
];

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickMate(mates: Mate[], seed: string): Mate | null {
  if (!mates.length) return null;
  return mates[hash(seed) % mates.length]!;
}

export function preferredTemplate(memories: string[], romanceOk: boolean): string {
  const blob = memories.join(" ").toLowerCase();
  if (romanceOk && /crush|romance|movie|date/.test(blob)) return "date";
  if (/art|music|club|debate|robot/.test(blob)) return "club";
  if (/quiet|study|library|read/.test(blob)) return "library";
  if (/lunch|food|friend|kind/.test(blob)) return "lunch";
  return "project";
}

export function buildRuleEvents(input: {
  userId: string;
  memories: string[];
  classmates: Mate[];
  crushIds?: string[];
  romanceOk: boolean;
  now: Date;
}): DraftEvent[] {
  const day = input.now.toISOString().slice(0, 10);
  const template = preferredTemplate(input.memories, input.romanceOk);
  const crush = template === "date"
    ? input.classmates.find((mate) => input.crushIds?.includes(mate.id))
    : undefined;
  const mate = crush ?? pickMate(input.classmates, `${input.userId}:${day}:${template}`);
  const events: DraftEvent[] = [];
  const social = socialEvent(template, mate, input.romanceOk);
  if (social) events.push(social);
  const personal = PERSONAL[hash(`${input.userId}:${day}:personal`) % PERSONAL.length]!();
  events.push(personal);
  return events.filter((event) => event.personIds.every((id) => input.classmates.some((mate) => mate.id === id)));
}

function socialEvent(template: string, mate: Mate | null, romanceOk: boolean): DraftEvent | null {
  if (!mate) return null;
  const club = mate.clubs.split("·")[0]?.trim() || mate.clubs || "the club";
  if (template === "date" && romanceOk) {
    return {
      emoji: "💕",
      title: `${mate.displayName} asked you out`,
      body: `${mate.displayName} caught you after class and asked if you'd like to see a movie this weekend. They seemed nervous and hopeful. How do you respond?`,
      personIds: [mate.id],
      romantic: true,
      choices: [
        { key: "yes", label: `Say yes to ${first(mate.displayName)}`, friendship: 15, reputation: 4, interest: "High", memory: "Open to a low-key movie plan" },
        { key: "friends", label: "Suggest hanging out as friends", friendship: 6, reputation: 3, interest: "Medium", memory: "Likes keeping things friendly" },
        { key: "later", label: "Say not this weekend", friendship: -2, reputation: 1, memory: "Needs plans with some notice" },
      ],
    };
  }
  if (template === "club") {
    return {
      emoji: "🎭",
      title: `${mate.displayName} saved you a seat at ${club}`,
      body: `${mate.displayName} waved you over at ${club}. There's an empty chair and a spare pencil. What do you do?`,
      personIds: [mate.id],
      romantic: false,
      choices: [
        { key: "join", label: "Sit down and join in", friendship: 12, reputation: 5, memory: "Shows up for club invites" },
        { key: "listen", label: "Stay for a few minutes, then head out", friendship: 4, reputation: 2, memory: "Samples clubs before committing" },
        { key: "wave", label: "Wave and keep walking", friendship: -3, memory: "Sometimes prefers a solo afternoon" },
      ],
    };
  }
  if (template === "library") {
    return {
      emoji: "📚",
      title: `${mate.displayName} slid notes across the library table`,
      body: `The library is hushed. ${mate.displayName} nudges a page of notes toward you and mouths "want these?"`,
      personIds: [mate.id],
      romantic: false,
      choices: [
        { key: "thanks", label: "Take the notes and say thanks", friendship: 10, reputation: 4, memory: "Appreciates quiet help" },
        { key: "share", label: "Trade notes both ways", friendship: 12, reputation: 6, memory: "Likes studying with a partner" },
        { key: "nope", label: "Shake your head and stay in the zone", friendship: 0, memory: "Guards deep-focus time" },
      ],
    };
  }
  if (template === "lunch") {
    return {
      emoji: "🥗",
      title: `${mate.displayName} saved you a seat at lunch`,
      body: `${mate.displayName} has a tray and an empty spot. They look like they actually want to talk, not just fill a table.`,
      personIds: [mate.id],
      romantic: false,
      choices: [
        { key: "sit", label: "Sit down and catch up", friendship: 12, reputation: 4, memory: "Likes catching up at lunch" },
        { key: "invite", label: "Invite them to your usual table", friendship: 15, reputation: 6, memory: "Brings people into the group" },
        { key: "walk", label: "Grab food and eat outside", friendship: -2, memory: "Sometimes wants a quiet lunch" },
      ],
    };
  }
  return {
    emoji: "🧪",
    title: `You and ${mate.displayName} got paired for a project`,
    body: `The pairing sheet lands you with ${mate.displayName}. You've got a week and a blank poster board. How do you start?`,
    personIds: [mate.id],
    romantic: false,
    choices: [
      { key: "plan", label: "Suggest a plan before the bell", friendship: 10, reputation: 6, memory: "Takes the lead on group work" },
      { key: "follow", label: "Ask what they want to do", friendship: 8, reputation: 3, memory: "Happy to follow a classmate's idea" },
      { key: "later", label: "Say you'll text tonight", friendship: 2, reputation: 1, memory: "Works better after school hours" },
    ],
  };
}

function first(name: string): string {
  return name.split(" ")[0] || name;
}

export function sanitizeDrafts(drafts: DraftEvent[], eligibleIds: Set<string>, romanceOk: boolean): DraftEvent[] {
  return drafts.filter((draft) => {
    if (!draft.title || !draft.body || !Array.isArray(draft.choices) || draft.choices.length === 0) return false;
    if (draft.romantic && !romanceOk) return false;
    if (!romanceOk && /ask(ed)? you out|date|kiss|crush/i.test(`${draft.title} ${draft.body}`)) return false;
    if (draft.personIds.some((id) => !eligibleIds.has(id))) return false;
    return draft.choices.every((choice) => choice.key && choice.label);
  });
}

type LlmEvent = {
  emoji?: string;
  title?: string;
  body?: string;
  personIds?: string[];
  romantic?: boolean;
  choices?: Choice[];
};

export function draftsFromLlm(raw: string, eligibleIds: Set<string>, romanceOk: boolean): DraftEvent[] {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[0]) as { events?: LlmEvent[] };
    const drafts: DraftEvent[] = (parsed.events ?? []).map((event) => ({
      emoji: event.emoji || "✨",
      title: event.title || "",
      body: event.body || "",
      personIds: event.personIds ?? [],
      romantic: Boolean(event.romantic),
      choices: (event.choices ?? []).slice(0, 3).map((choice, index) => ({
        key: choice.key || `c${index}`,
        label: choice.label,
        friendship: choice.friendship,
        reputation: choice.reputation,
        interest: choice.interest,
        memory: choice.memory,
      })),
    }));
    return sanitizeDrafts(drafts, eligibleIds, romanceOk).slice(0, 2);
  } catch {
    return [];
  }
}

export async function completeWithLlm(prompt: string): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const base = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  try {
    const response = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content:
              "You write JSON for a kind high-school life sim. Only mention personIds from the list. Never invent students, teachers, or staff. No harassment. If romance is false, no dating, crushes, or kisses. Reply with JSON only.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    return data.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

async function draftsForUser(
  user: User,
  mates: Mate[],
  memories: string[],
  now: Date,
  crushIds: string[] = [],
): Promise<{ drafts: DraftEvent[]; provider: "llm" | "rules" }> {
  const romanceOk = romanticAllowed(user, now);
  const eligible = new Set(mates.map((mate) => mate.id));
  const rules = buildRuleEvents({ userId: user.id, memories, classmates: mates, crushIds, romanceOk, now });
  const prompt = JSON.stringify({
    student: user.displayName,
    romanceOk,
    crushIds: romanceOk ? crushIds.filter((id) => eligible.has(id)) : [],
    memories: user.memoryOptIn ? memories : [],
    classmates: mates.map((mate) => ({ id: mate.id, name: mate.displayName, clubs: mate.clubs })),
    instruction: "Return { events: [{ emoji, title, body, personIds, romantic, choices: [{ key, label, friendship, reputation, memory }] }] } with 1 event. Romantic events must use a crushId when one is listed.",
  });
  const llm = await completeWithLlm(prompt);
  if (llm) {
    const parsed = draftsFromLlm(llm, eligible, romanceOk);
    if (parsed.length) return { drafts: parsed, provider: "llm" };
  }
  return { drafts: rules, provider: "rules" };
}

export async function runAutopilot(options: { now?: Date; force?: boolean; onlyUserId?: string } = {}) {
  const now = options.now ?? new Date();
  const prisma = getPrisma();
  const users = await prisma.user.findMany({
    where: options.onlyUserId ? { id: options.onlyUserId } : undefined,
  });
  let created = 0;
  let provider: "llm" | "rules" | "none" = "none";
  const skipped: string[] = [];
  for (const user of users) {
    if (!canRunAutopilot(user, now)) {
      skipped.push(user.id);
      continue;
    }
    const hour = now.getUTCHours();
    if (!options.force && !isAsleep(hour, user.sleepStartHour, user.sleepEndHour)) {
      skipped.push(user.id);
      continue;
    }
    const dayStart = new Date(now);
    dayStart.setUTCHours(0, 0, 0, 0);
    const already = await prisma.feedEvent.count({
      where: { userId: user.id, source: "autopilot", createdAt: { gte: dayStart } },
    });
    if (already > 0 && !(options.force && options.onlyUserId)) continue;

    const mates = (await discoverableClassmates(user.id, now)).map((mate) => ({
      id: mate.id,
      displayName: mate.displayName || "Classmate",
      clubs: mate.clubs,
    }));
    const memoryRows = user.memoryOptIn
      ? await prisma.avatarMemory.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 12 })
      : [];
    const memories = memoryRows.map((row) => row.content);
    const crushes = await prisma.crush.findMany({ where: { userId: user.id } });
    const result = await draftsForUser(user, mates, memories, now, crushes.map((row) => row.crushId));
    provider = result.provider;
    for (const draft of result.drafts) {
      await prisma.feedEvent.create({
        data: {
          userId: user.id,
          emoji: draft.emoji,
          title: draft.title,
          body: draft.body,
          choices: JSON.stringify(draft.choices),
          status: "open",
          source: "autopilot",
          romantic: draft.romantic,
          createdAt: now,
          ...(draft.personIds.length
            ? { people: { create: draft.personIds.map((personId) => ({ userId: personId })) } }
            : {}),
        },
      });
      created += 1;
    }
  }
  return { created, provider, considered: users.length, skipped: skipped.length };
}

export function parseChoices(raw: string): Choice[] {
  try {
    const data = JSON.parse(raw) as Choice[];
    if (!Array.isArray(data)) return [];
    return data.filter((choice) => choice && typeof choice.key === "string" && typeof choice.label === "string");
  } catch {
    return [];
  }
}

export async function respondToEvent(input: { userId: string; eventId: string; choiceKey: string; now?: Date }) {
  const prisma = getPrisma();
  const event = await prisma.feedEvent.findUnique({
    where: { id: input.eventId },
    include: { people: true },
  });
  if (!event || event.userId !== input.userId) return { ok: false as const, error: "That moment isn't on your feed." };
  if (event.status !== "open") return { ok: false as const, error: "You already responded." };
  const choice = parseChoices(event.choices).find((item) => item.key === input.choiceKey);
  if (!choice) return { ok: false as const, error: "That isn't one of the choices." };
  const user = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!user) return { ok: false as const, error: "Account not found." };
  const now = input.now ?? new Date();
  await prisma.$transaction(async (tx) => {
    await tx.feedEvent.update({ where: { id: event.id }, data: { status: "resolved", chosenKey: choice.key } });
    if (choice.reputation) {
      await tx.pointEvent.create({ data: { userId: user.id, points: choice.reputation, reason: event.title, createdAt: now } });
      await tx.user.update({ where: { id: user.id }, data: { points: { increment: choice.reputation } } });
    }
    for (const person of event.people) {
      await bumpStat(user.id, person.userId, { friendship: choice.friendship, interest: choice.interest }, tx);
    }
    await remember(user.id, user.memoryOptIn, choice.memory, event.title, choice.interest ? "social" : "preference", tx);
  });
  return { ok: true as const, choice };
}
