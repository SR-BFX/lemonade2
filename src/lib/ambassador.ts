import { messageProblem } from "./filter";
import { getPrisma } from "./prisma";
import { err, ok, type Result } from "./result";

export async function applyAmbassador(input: {
  userId: string;
  grade: number;
  pitch: string;
}): Promise<Result<{ status: string }>> {
  if (![9, 10, 11, 12].includes(input.grade)) return err("Pick your grade.");
  const pitch = input.pitch.trim();
  const problem = messageProblem(pitch, 280);
  if (problem) return err(problem);
  if (pitch.length < 12) return err("Tell us in a sentence or two how you'd invite classmates. No roster uploads.");
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!user?.grade) return err("Finish your profile first.");
  const existing = await prisma.ambassadorApplication.findUnique({ where: { userId: input.userId } });
  if (existing?.status === "approved") return err("You're already an ambassador. Share your invite link.");
  if (existing) {
    await prisma.ambassadorApplication.update({
      where: { id: existing.id },
      data: { grade: input.grade, pitch, status: "pending" },
    });
  } else {
    await prisma.ambassadorApplication.create({
      data: { userId: input.userId, schoolId: user.schoolId, grade: input.grade, pitch, status: "pending" },
    });
  }
  return ok({ status: "pending" });
}

export async function requestNewSchool(input: { name: string; city: string; domain: string; contactEmail: string }) {
  const name = input.name.trim();
  const city = input.city.trim();
  const domain = input.domain.trim().toLowerCase().replace(/^@/, "");
  const contactEmail = input.contactEmail.trim().toLowerCase();
  if (name.length < 3 || city.length < 2) return err("Add the school name and city.");
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) return err("Add the school's email domain, like students.example.");
  if (!contactEmail.includes("@")) return err("Add a contact email so we can reply.");
  const prisma = getPrisma();
  await prisma.schoolRequest.create({ data: { name, city, domain, contactEmail } });
  return ok({ requested: true });
}
