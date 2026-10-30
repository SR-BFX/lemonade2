import { approveParentalConsent } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ConsentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await approveParentalConsent(token);
  return (
    <main className="px-5 py-12">
      <p className="text-5xl">{result.ok ? "🍋" : "📭"}</p>
      <h1 className="mt-2 text-3xl font-extrabold">{result.ok ? "Approved" : "Link didn't work"}</h1>
      <p className="mt-2 font-semibold text-ink/70">
        {result.ok
          ? `${result.data.studentName} can now appear in the directory if they opted in. Autopilot still waits for their own opt-in switch.`
          : result.error}
      </p>
    </main>
  );
}
