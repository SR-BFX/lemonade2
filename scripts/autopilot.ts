import { runAutopilot } from "../src/lib/autopilot";
import { getPrisma } from "../src/lib/prisma";

const force = process.argv.includes("--force");
const emailFlag = process.argv.find((arg) => arg.startsWith("--email="));
const email = emailFlag?.split("=")[1];

async function main() {
  const prisma = getPrisma();
  const user = email ? await prisma.user.findUnique({ where: { email } }) : null;
  if (email && !user) {
    console.error(`No user for ${email}`);
    process.exit(1);
  }
  const result = await runAutopilot({ force, onlyUserId: user?.id });
  console.log(JSON.stringify(result, null, 2));
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
