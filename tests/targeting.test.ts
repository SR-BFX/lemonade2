import { beforeEach, describe, expect, it } from "vitest";
import { buildRuleEvents, draftsFromLlm, preferredTemplate, sanitizeDrafts } from "@/lib/autopilot";
import { runAutopilot } from "@/lib/autopilot";
import { sendGift, giftView } from "@/lib/gifts";
import { blockUser } from "@/lib/moderation";
import { createPoll } from "@/lib/polls";
import { makeSchool, makeUser, prisma, resetDatabase } from "./helpers";

beforeEach(async () => {
  await resetDatabase();
});

describe("people who have not joined cannot be targeted", () => {
  it("refuses gifts, polls, and autopilot mentions for anyone not opted in", async () => {
    const school = await makeSchool();
    const other = await makeSchool({ domain: "roosevelt.example", name: "Roosevelt Academy" });
    const alex = await makeUser({
      schoolId: school.id,
      name: "Alex Johnson",
      email: "alex.johnson@lincoln.example",
      autopilotOptIn: true,
      memoryOptIn: true,
    });
    const emma = await makeUser({ schoolId: school.id, name: "Emma Martinez", email: "emma.martinez@lincoln.example" });
    const hidden = await makeUser({
      schoolId: school.id,
      name: "Hidden Student",
      email: "hidden@lincoln.example",
      directoryOptIn: false,
    });
    const outsider = await makeUser({
      schoolId: other.id,
      name: "Avery Brooks",
      email: "avery.brooks@roosevelt.example",
    });

    const missing = await sendGift({
      fromId: alex.id,
      toId: "ck_not_a_real_student",
      giftKey: "cupcake",
      anonymous: false,
      message: "",
    });
    expect(missing.ok).toBe(false);

    const optedOut = await sendGift({ fromId: alex.id, toId: hidden.id, giftKey: "cupcake", anonymous: false, message: "" });
    expect(optedOut.ok).toBe(false);
    if (!optedOut.ok) expect(optedOut.error).toMatch(/hasn't joined|opted in/i);

    const crossSchool = await sendGift({ fromId: alex.id, toId: outsider.id, giftKey: "cupcake", anonymous: false, message: "" });
    expect(crossSchool.ok).toBe(false);

    const poll = await createPoll({
      authorId: alex.id,
      question: "Who should bring snacks to the club fair?",
      category: "fun",
      options: [{ type: "member", userId: hidden.id }, { type: "member", userId: emma.id }],
    });
    expect(poll.ok).toBe(false);

    const teachers = await createPoll({
      authorId: alex.id,
      question: "Which teacher is most likely to give a pop quiz?",
      category: "fun",
      options: [{ type: "text", label: "Pop quiz" }, { type: "text", label: "No quiz" }],
    });
    expect(teachers.ok).toBe(false);

    const staffCategory = await createPoll({
      authorId: alex.id,
      question: "Best place to eat lunch?",
      category: "teachers",
      options: [{ type: "text", label: "Courtyard" }, { type: "text", label: "Cafeteria" }],
    });
    expect(staffCategory.ok).toBe(false);

    const awake = await runAutopilot({ now: new Date("2026-10-30T15:00:00.000Z"), onlyUserId: alex.id });
    expect(awake.created).toBe(0);

    await prisma().avatarMemory.create({
      data: { userId: alex.id, kind: "preference", content: "loves the art club", source: "test" },
    });
    await prisma().user.update({ where: { id: emma.id }, data: { clubs: "Art Club" } });
    const night = new Date("2026-10-30T23:00:00.000Z");
    const asleep = await runAutopilot({ now: night, onlyUserId: alex.id });
    expect(asleep.created).toBeGreaterThan(0);
    const mentions = await prisma().feedEventPerson.findMany({
      where: { event: { userId: alex.id } },
    });
    const mentioned = new Set(mentions.map((row) => row.userId));
    expect(mentioned.has(hidden.id)).toBe(false);
    expect(mentioned.has(outsider.id)).toBe(false);
    expect(mentioned.has(emma.id)).toBe(true);

    await prisma().user.update({ where: { id: emma.id }, data: { allowAnonymous: false } });
    const anon = await sendGift({ fromId: alex.id, toId: emma.id, giftKey: "wink", anonymous: true, message: "" });
    expect(anon.ok).toBe(false);

    const named = await sendGift({ fromId: alex.id, toId: emma.id, giftKey: "wink", anonymous: false, message: "nice work" });
    expect(named.ok).toBe(true);
    const rude = await sendGift({ fromId: alex.id, toId: emma.id, giftKey: "hug", anonymous: false, message: "fuck this" });
    expect(rude.ok).toBe(false);

    await blockUser(emma.id, alex.id);
    const blocked = await sendGift({ fromId: alex.id, toId: emma.id, giftKey: "cupcake", anonymous: false, message: "" });
    expect(blocked.ok).toBe(false);
  });

  it("drops model output that names anyone outside the eligible set or adds romance under 16", () => {
    const eligible = new Set(["emma"]);
    const raw = JSON.stringify({
      events: [
        {
          emoji: "💕",
          title: "A stranger asked you out",
          body: "Someone not on the list.",
          personIds: ["not-a-student"],
          romantic: true,
          choices: [{ key: "no", label: "Nope" }],
        },
        {
          emoji: "📚",
          title: "Emma shared notes",
          body: "Library table.",
          personIds: ["emma"],
          romantic: false,
          choices: [{ key: "thanks", label: "Say thanks", friendship: 4 }],
        },
      ],
    });
    const parsed = draftsFromLlm(raw, eligible, false);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.personIds).toEqual(["emma"]);

    const romance = sanitizeDrafts(
      [
        {
          emoji: "💕",
          title: "Emma asked you out",
          body: "Movies?",
          personIds: ["emma"],
          romantic: true,
          choices: [{ key: "no", label: "Not now" }],
        },
      ],
      eligible,
      false,
    );
    expect(romance).toHaveLength(0);
    expect(preferredTemplate(["loves the art club"], false)).toBe("club");
    const drafted = buildRuleEvents({
      userId: "alex",
      memories: ["loves the art club"],
      classmates: [{ id: "emma", displayName: "Emma Martinez", clubs: "Art Club" }],
      romanceOk: false,
      now: new Date("2026-10-30T23:00:00.000Z"),
    });
    expect(drafted[0]?.title.toLowerCase()).toMatch(/club/);
    expect(drafted.every((event) => event.personIds.every((id) => id === "emma"))).toBe(true);
  });

  it("keeps the anonymous sender for moderators and hides them from the recipient", () => {
    const gift = { anonymous: true, fromId: "alex", toId: "emma" };
    expect(giftView(gift, "emma", false).showSender).toBe(false);
    expect(giftView(gift, "alex", false).showSender).toBe(true);
    expect(giftView(gift, "mod", true).showSender).toBe(true);
  });
});
