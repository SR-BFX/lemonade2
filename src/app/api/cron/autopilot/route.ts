import { runAutopilot } from "@/lib/autopilot";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("x-cron-secret") !== secret) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({})) as { force?: boolean; onlyUserId?: string };
  const result = await runAutopilot({ force: Boolean(body.force), onlyUserId: body.onlyUserId });
  return Response.json(result);
}
