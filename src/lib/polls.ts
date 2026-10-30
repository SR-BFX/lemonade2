import { interactionBlockReason, isDiscoverable } from "./eligibility";
import { hasProfanity, mentionsStaff, messageProblem } from "./filter";
import { getPrisma } from "./prisma";
import { err, ok, type Result } from "./result";
import { awardPoints } from "./social";

export type PollOptionInput =
  | { type: "member"; userId: string }
  | { type: "text"; label: string };

export async function createPoll(input: {
  authorId: string;
  question: string;
  category: string;
  options: PollOptionInput[];
}): Promise<Result<{ pollId: string }>> {
  const question = input.question.trim();
  if (question.length < 8 || question.length > 140) return err("Ask a question between 8 and 140 characters.");
  if (hasProfanity(question) || mentionsStaff(question)) {
    return err("Polls stay kind and are never about teachers or staff.");
  }
  const category = input.category.trim().toLowerCase();
  if (!["school", "fun", "friends"].includes(category)) return err("Pick a category: school, fun, or friends.");
  if (category === "teachers" || mentionsStaff(category)) return err("Polls about teachers aren't allowed.");
  if (input.options.length < 2 || input.options.length > 6) return err("Add 2 to 6 options.");

  const prisma = getPrisma();
  const author = await prisma.user.findUnique({ where: { id: input.authorId } });
  if (!author) return err("Account not found.");
  if (!isDiscoverable(author)) return err("Your profile isn't visible yet, so you can't start a poll.");

  const labels: { label: string; userId: string | null }[] = [];
  for (const option of input.options) {
    if (option.type === "text") {
      const label = option.label.trim();
      if (label.length < 1 || label.length > 40) return err("Each option needs 1–40 characters.");
      if (hasProfanity(label) || mentionsStaff(label) || label.includes("@")) {
        return err("Options can't target teachers, staff, or people by email.");
      }
      labels.push({ label, userId: null });
    } else {
      const reason = await interactionBlockReason(input.authorId, option.userId);
      if (reason) return err(reason);
      const person = await prisma.user.findUnique({ where: { id: option.userId } });
      if (!person?.displayName) return err("That student hasn't joined Lemonade.");
      labels.push({ label: person.displayName, userId: person.id });
    }
  }

  const poll = await prisma.poll.create({
    data: {
      authorId: input.authorId,
      schoolId: author.schoolId,
      question,
      category,
      options: { create: labels },
    },
  });
  await awardPoints(input.authorId, 4, "Started a poll");
  return ok({ pollId: poll.id });
}

export async function voteOnPoll(userId: string, optionId: string): Promise<Result<{ pollId: string }>> {
  const prisma = getPrisma();
  const option = await prisma.pollOption.findUnique({ where: { id: optionId }, include: { poll: true } });
  if (!option) return err("That option isn't available.");
  const voter = await prisma.user.findUnique({ where: { id: userId } });
  if (!voter || voter.schoolId !== option.poll.schoolId || !isDiscoverable(voter)) {
    return err("This poll is for students at that school who joined and opted in.");
  }
  if (option.userId) {
    const reason = await interactionBlockReason(userId, option.userId);
    if (reason && option.userId !== userId) return err(reason);
  }
  const existing = await prisma.pollVote.findUnique({ where: { pollId_userId: { pollId: option.pollId, userId } } });
  if (existing) return err("You already voted on this poll.");
  await prisma.pollVote.create({ data: { optionId, userId, pollId: option.pollId } });
  await awardPoints(userId, 2, "Voted in a poll");
  return ok({ pollId: option.pollId });
}

export async function commentOnPoll(userId: string, pollId: string, body: string): Promise<Result<{ id: string }>> {
  const problem = messageProblem(body, 240);
  if (problem) return err(problem);
  const text = body.trim();
  if (!text) return err("Write a comment first.");
  if (mentionsStaff(text)) return err("Keep comments off teachers and staff.");
  const prisma = getPrisma();
  const poll = await prisma.poll.findUnique({ where: { id: pollId } });
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!poll || !user || user.schoolId !== poll.schoolId) return err("Poll not found.");
  const comment = await prisma.pollComment.create({ data: { pollId, userId, body: text } });
  return ok({ id: comment.id });
}
