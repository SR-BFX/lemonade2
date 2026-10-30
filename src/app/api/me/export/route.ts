import { exportAccount } from "@/lib/account";
import { getCurrentUser } from "@/server/session";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response("Sign in first", { status: 401 });
  const data = await exportAccount(user.id);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="lemonade-${user.handle || "export"}.json"`,
    },
  });
}
