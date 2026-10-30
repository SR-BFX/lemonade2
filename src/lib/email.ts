import { getPrisma } from "./prisma";

export async function sendEmail(to: string, subject: string, body: string) {
  const prisma = getPrisma();
  await prisma.emailMessage.create({ data: { to, subject, body } });
  console.log(`\n[lemonade mail] To: ${to}\nSubject: ${subject}\n${body}\n`);
}

export async function latestCodeFor(email: string): Promise<string | null> {
  const prisma = getPrisma();
  const message = await prisma.emailMessage.findFirst({
    where: { to: email.toLowerCase(), subject: { contains: "code" } },
    orderBy: { createdAt: "desc" },
  });
  const match = message?.body.match(/\b(\d{6})\b/);
  return match?.[1] ?? null;
}
