import { getPrisma } from "../src/lib/prisma";
import { dayKey } from "../src/lib/age";

const prisma = getPrisma();

const schools = [
  ["Lincoln High School", "Public", "lincoln.example", 0.8],
  ["Roosevelt Academy", "Private", "roosevelt.example", 1.2],
  ["Washington High", "Public", "washington.example", 2.1],
  ["Jefferson Prep", "Charter", "jefferson.example", 3.4],
  ["Madison High School", "Public", "madison.example", 4.7],
  ["St. Mary's Catholic High", "Private", "stmarys.example", 5.2],
  ["Kennedy Technical High", "Public", "kennedy.example", 6.8],
  ["Adams International", "Charter", "adams.example", 7.9],
] as const;

type Student = {
  email: string;
  name: string;
  handle: string;
  grade: number;
  points: number;
  weekly: number;
  emoji: string;
  traits: string;
  clubs: string;
  gems?: number;
  stars?: number;
  role?: string;
  directory?: boolean;
  autopilot?: boolean;
  memory?: boolean;
  streak?: number;
  dob?: string;
};

const lincoln: Student[] = [
  { email: "jade.chen@lincoln.example", name: "Jade Chen", handle: "jade_chen", grade: 12, points: 2340, weekly: 150, emoji: "🌟", traits: "Driven · Warm", clubs: "Student Council · Yearbook", autopilot: true, memory: true, streak: 6 },
  { email: "noah.williams@lincoln.example", name: "Noah Williams", handle: "noah_w", grade: 12, points: 1850, weekly: 180, emoji: "🎧", traits: "Outgoing · Steady", clubs: "Basketball · Honor Society", streak: 4 },
  { email: "ethan.johnson@lincoln.example", name: "Ethan Johnson", handle: "ethan_j", grade: 11, points: 1620, weekly: 120, emoji: "⚽", traits: "Funny · Loyal", clubs: "Soccer · Spanish Club", streak: 3 },
  { email: "madison.taylor@lincoln.example", name: "Madison Taylor", handle: "madison_t", grade: 12, points: 1500, weekly: 70, emoji: "👑", traits: "Organized · Bold", clubs: "Class President · NHS" },
  { email: "jessica.kim@lincoln.example", name: "Jessica Kim", handle: "jessica_kim", grade: 11, points: 1400, weekly: 60, emoji: "🤖", traits: "Curious · Kind", clubs: "Robotics · Science Fair" },
  { email: "olivia.davis@lincoln.example", name: "Olivia Davis", handle: "olivia_d", grade: 10, points: 1350, weekly: 55, emoji: "📚", traits: "Thoughtful · Sharp", clubs: "Debate Team · Yearbook" },
  { email: "luis.garcia@lincoln.example", name: "Luis Garcia", handle: "luis_g", grade: 10, points: 1300, weekly: 40, emoji: "🎨", traits: "Creative · Easygoing", clubs: "Soccer · Art Club" },
  { email: "sarah.adams@lincoln.example", name: "Sarah Adams", handle: "sarah_adams", grade: 10, points: 1280, weekly: 35, emoji: "🌸", traits: "Friendly · Focused", clubs: "Biology Club · Drama Club" },
  { email: "ryan.miller@lincoln.example", name: "Ryan Miller", handle: "ryan_m", grade: 11, points: 1260, weekly: 30, emoji: "🎸", traits: "Chill · Reliable", clubs: "Band · Computer Club" },
  { email: "mia.patel@lincoln.example", name: "Mia Patel", handle: "mia_patel", grade: 9, points: 1255, weekly: 28, emoji: "🐻", traits: "Bright · Brave", clubs: "Drama Club" },
  { email: "jordan.blake@lincoln.example", name: "Jordan Blake", handle: "jordan_b", grade: 11, points: 1250, weekly: 25, emoji: "😎", traits: "Playful · Private", clubs: "Photography" },
  { email: "alex.johnson@lincoln.example", name: "Alex Johnson", handle: "alexj_2024", grade: 11, points: 1247, weekly: 90, emoji: "🍋", traits: "Curious · Kind", clubs: "Art Club · Intramural soccer", gems: 180, stars: 245, autopilot: true, memory: true, streak: 7 },
  { email: "emma.martinez@lincoln.example", name: "Emma Martinez", handle: "emma_m", grade: 11, points: 980, weekly: 80, emoji: "🎨", traits: "Artistic · Kind", clubs: "Debate Team", autopilot: true, memory: true, streak: 5 },
  { email: "riley.quinn@lincoln.example", name: "Riley Quinn", handle: "riley_q", grade: 9, points: 40, weekly: 10, emoji: "😊", traits: "New · Hopeful", clubs: "", gems: 80, stars: 30 },
];

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function atHour(hour: number, minute: number) {
  const date = new Date();
  date.setUTCHours(hour, minute, 0, 0);
  return date;
}

async function main() {
  const existing = await prisma.school.count();
  if (existing > 0) {
    console.log("Seed already present. Run npm run db:reset to start over.");
    return;
  }

  const schoolRows = new Map<string, { id: string }>();
  for (const [name, kind, emailDomain, distanceMiles] of schools) {
    const school = await prisma.school.create({
      data: { name, kind, grades: "9-12", city: "Springfield", emailDomain, distanceMiles },
    });
    schoolRows.set(emailDomain, school);
  }
  const lincolnSchool = schoolRows.get("lincoln.example")!;
  const roosevelt = schoolRows.get("roosevelt.example")!;
  const today = dayKey();

  const users = new Map<string, { id: string; name: string }>();
  for (const student of lincoln) {
    const user = await prisma.user.create({
      data: {
        email: student.email,
        schoolId: lincolnSchool.id,
        emailVerifiedAt: daysAgo(40),
        displayName: student.name,
        handle: student.handle,
        grade: student.grade,
        dateOfBirth: student.dob ?? "2008-06-15",
        avatarEmoji: student.emoji,
        traits: student.traits,
        clubs: student.clubs,
        bio: student.handle === "alexj_2024" ? "Figuring out junior year, one lemonade at a time." : "",
        points: student.points,
        gems: student.gems ?? 80,
        stars: student.stars ?? 40,
        streak: student.streak ?? 1,
        lastActiveOn: today,
        role: "student",
        directoryOptIn: student.directory ?? true,
        allowAnonymous: true,
        autopilotOptIn: student.autopilot ?? false,
        memoryOptIn: student.memory ?? false,
        onboardingStep: "done",
        createdAt: daysAgo(50),
      },
    });
    users.set(student.handle, { id: user.id, name: student.name });
    const mid = Math.round((student.points - student.weekly) * 0.35);
    const ancient = student.points - student.weekly - mid;
    if (ancient > 0) {
      await prisma.pointEvent.create({ data: { userId: user.id, points: ancient, reason: "Earlier this year", createdAt: daysAgo(100) } });
    }
    if (mid > 0) {
      await prisma.pointEvent.create({ data: { userId: user.id, points: mid, reason: "This month", createdAt: daysAgo(20) } });
    }
    if (student.weekly > 0) {
      await prisma.pointEvent.create({ data: { userId: user.id, points: student.weekly, reason: "This week", createdAt: daysAgo(2) } });
    }
    await prisma.invite.create({
      data: {
        code: student.handle === "alexj_2024" ? "ALEX2026" : student.handle === "noah_w" ? "NOAH2026" : `${student.handle}`.replace(/_/g, "").slice(0, 8).toUpperCase(),
        inviterId: user.id,
        schoolId: lincolnSchool.id,
        uses: student.handle === "alexj_2024" ? 2 : 0,
      },
    });
  }

  const mod = await prisma.user.create({
    data: {
      email: "quinn.harper@lincoln.example",
      schoolId: lincolnSchool.id,
      emailVerifiedAt: daysAgo(20),
      displayName: "Quinn Harper",
      handle: "quinn_mod",
      grade: 12,
      dateOfBirth: "2008-01-20",
      avatarEmoji: "🍋",
      role: "moderator",
      directoryOptIn: false,
      onboardingStep: "done",
      points: 0,
      gems: 0,
      stars: 0,
    },
  });
  await prisma.invite.create({ data: { code: "QUINNMOD", inviterId: mod.id, schoolId: lincolnSchool.id } });

  const avery = await prisma.user.create({
    data: {
      email: "avery.brooks@roosevelt.example",
      schoolId: roosevelt.id,
      emailVerifiedAt: daysAgo(3),
      displayName: "Avery Brooks",
      handle: "avery_b",
      grade: 10,
      dateOfBirth: "2009-04-04",
      avatarEmoji: "🌸",
      traits: "Eager · New",
      clubs: "Newspaper",
      directoryOptIn: true,
      onboardingStep: "done",
      points: 20,
      gems: 80,
      stars: 30,
    },
  });
  await prisma.pointEvent.create({ data: { userId: avery.id, points: 20, reason: "Joined", createdAt: daysAgo(2) } });
  await prisma.invite.create({ data: { code: "AVERY100", inviterId: avery.id, schoolId: roosevelt.id } });

  const alex = users.get("alexj_2024")!;
  const emma = users.get("emma_m")!;
  const jade = users.get("jade_chen")!;
  const noah = users.get("noah_w")!;
  const sarah = users.get("sarah_adams")!;
  const ethan = users.get("ethan_j")!;
  const jordan = users.get("jordan_b")!;

  for (const friendId of [emma.id, jade.id, noah.id, sarah.id]) {
    await prisma.friendship.create({ data: { userId: alex.id, friendId } });
  }
  await prisma.friendship.create({ data: { userId: emma.id, friendId: alex.id } });
  await prisma.crush.create({ data: { userId: alex.id, crushId: emma.id } });
  await prisma.crush.create({ data: { userId: emma.id, crushId: alex.id } });
  await prisma.socialStat.create({ data: { userId: alex.id, otherId: emma.id, friendship: 75, interest: "High" } });
  await prisma.socialStat.create({ data: { userId: emma.id, otherId: alex.id, friendship: 80, interest: "High" } });

  await prisma.avatarMemory.createMany({
    data: [
      { userId: alex.id, kind: "preference", content: "Likes catching up at lunch", source: "A lunch invite" },
      { userId: alex.id, kind: "preference", content: "Shows up for club invites", source: "Art club" },
      { userId: alex.id, kind: "social", content: "Open to a low-key movie plan", source: "Emma" },
    ],
  });

  const dateChoices = JSON.stringify([
    { key: "yes", label: "Say yes to Emma", friendship: 15, reputation: 4, interest: "High", memory: "Open to a low-key movie plan" },
    { key: "friends", label: "Suggest hanging out as friends", friendship: 6, reputation: 3, interest: "Medium", memory: "Likes keeping things friendly" },
    { key: "later", label: "Say not this weekend", friendship: -2, reputation: 1, memory: "Needs plans with some notice" },
  ]);

  await prisma.feedEvent.create({
    data: {
      userId: alex.id,
      emoji: "👋",
      title: "You got kicked out of class",
      body: "A laugh landed at the wrong second and you spent a few minutes in the hallway. Nobody's mad. How do you walk back in?",
      choices: JSON.stringify([
        { key: "notes", label: "Use the time to rewrite your notes", reputation: 6, memory: "Resets quickly after an awkward moment" },
        { key: "joke", label: "Own the joke when you walk back in", reputation: 4, memory: "Uses humor to smooth things over" },
      ]),
      status: "resolved",
      chosenKey: "joke",
      source: "autopilot",
      createdAt: atHour(9, 15),
    },
  });
  await prisma.feedEvent.create({
    data: {
      userId: alex.id,
      emoji: "🌹",
      title: "You spoke to your crush and bought her flowers",
      body: "Emma laughed at the rose emoji before the real story: you actually just walked her to debate and split a lemonade.",
      choices: "[]",
      status: "resolved",
      source: "gift",
      romantic: true,
      createdAt: atHour(12, 45),
      people: { create: [{ userId: emma.id }] },
    },
  });
  await prisma.feedEvent.create({
    data: {
      userId: alex.id,
      emoji: "📊",
      title: "Jade was mentioned in a poll",
      body: "Jade Chen is on the class-president poll, along with you. It's a compliment pile, not a roast.",
      choices: "[]",
      status: "resolved",
      source: "poll",
      createdAt: atHour(13, 30),
      people: { create: [{ userId: jade.id }] },
    },
  });
  await prisma.feedEvent.create({
    data: {
      userId: alex.id,
      emoji: "💕",
      title: "Emma asked you out on a date",
      body: "Emma Martinez caught you after class and asked if you'd like to see a movie this weekend. She seemed nervous and hopeful.",
      choices: dateChoices,
      status: "open",
      source: "autopilot",
      romantic: true,
      createdAt: atHour(15, 45),
      people: { create: [{ userId: emma.id }] },
    },
  });

  const president = await prisma.poll.create({
    data: {
      authorId: jade.id,
      schoolId: lincolnSchool.id,
      question: "Who would make the best class president?",
      category: "school",
      createdAt: daysAgo(1),
      options: {
        create: [
          { label: "Alex Johnson", userId: alex.id },
          { label: "Emma Martinez", userId: emma.id },
          { label: "Noah Williams", userId: noah.id },
          { label: "Ethan Johnson", userId: ethan.id },
        ],
      },
    },
    include: { options: true },
  });
  const voters = [jade.id, emma.id, noah.id, ethan.id, sarah.id, jordan.id, users.get("olivia_d")!.id, users.get("mia_patel")!.id];
  const optionIds = president.options.map((option) => option.id);
  for (let index = 0; index < voters.length; index += 1) {
    const optionId = optionIds[index % optionIds.length]!;
    await prisma.pollVote.create({ data: { optionId, userId: voters[index]!, pollId: president.id } });
  }
  await prisma.pollComment.create({
    data: { pollId: president.id, userId: emma.id, body: "All of these people would actually listen.", createdAt: daysAgo(1) },
  });

  await prisma.poll.create({
    data: {
      authorId: alex.id,
      schoolId: lincolnSchool.id,
      question: "Where should the club-fair photo booth go?",
      category: "fun",
      createdAt: atHour(10, 15),
      options: { create: [{ label: "Courtyard" }, { label: "Cafeteria" }, { label: "Library lawn" }, { label: "Gym hallway" }] },
    },
  });
  await prisma.poll.create({
    data: {
      authorId: noah.id,
      schoolId: lincolnSchool.id,
      question: "Best group-project partner vibes?",
      category: "friends",
      options: { create: [{ label: "Alex Johnson", userId: alex.id }, { label: "Emma Martinez", userId: emma.id }] },
    },
  });
  await prisma.poll.create({
    data: {
      authorId: sarah.id,
      schoolId: lincolnSchool.id,
      question: "Who brings the best snacks to a club meeting?",
      category: "fun",
      options: { create: [{ label: "Alex Johnson", userId: alex.id }, { label: "Noah Williams", userId: noah.id }] },
    },
  });

  const giftPairs: [string, string, string, boolean][] = [
    [alex.id, emma.id, "red-rose", false],
    [alex.id, jade.id, "cupcake", false],
    [alex.id, noah.id, "high-five", false],
    [alex.id, sarah.id, "hug", false],
    [alex.id, ethan.id, "wink", false],
  ];
  for (const [fromId, toId, giftKey, anonymous] of giftPairs) {
    await prisma.giftSend.create({
      data: { fromId, toId, giftKey, anonymous, message: anonymous ? "" : "From the seed week.", gems: 30, createdAt: daysAgo(1) },
    });
  }
  const secret = await prisma.giftSend.create({
    data: {
      fromId: jordan.id,
      toId: alex.id,
      giftKey: "wink",
      anonymous: true,
      message: "Nice job on the poll.",
      gems: 25,
      createdAt: atHour(16, 5),
    },
  });
  await prisma.report.create({
    data: {
      reporterId: alex.id,
      targetType: "gift",
      targetId: secret.id,
      reason: "Just want a moderator to confirm this anonymous wink is fine.",
    },
  });

  await prisma.ambassadorApplication.create({
    data: {
      userId: noah.id,
      schoolId: lincolnSchool.id,
      grade: 12,
      pitch: "I'll share my invite link with basketball and honor society. No spreadsheets of names.",
      status: "approved",
    },
  });

  console.log("Seeded Lemonade.");
  console.log("Demo student: alex.johnson@lincoln.example");
  console.log("Empty-state student: riley.quinn@lincoln.example");
  console.log("Not-live school: avery.brooks@roosevelt.example");
  console.log("Moderator: quinn.harper@lincoln.example");
  console.log("Request a code, then open /dev/mail.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
