import { notFound } from "next/navigation";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DevMailPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const messages = await getPrisma().emailMessage.findMany({ orderBy: { createdAt: "desc" }, take: 30 });
  return (
    <main className="px-4 py-6">
      <h1 className="text-2xl font-extrabold">Dev mailbox</h1>
      <p className="text-sm font-semibold text-ink/60">Codes and parent links land here when no email provider is configured.</p>
      <ul className="mt-4 space-y-3">
        {messages.length === 0 ? <li className="card text-sm font-bold">No mail yet.</li> : null}
        {messages.map((message) => (
          <li key={message.id} className="card">
            <p className="text-xs font-extrabold text-ink/50">{message.createdAt.toISOString()}</p>
            <p className="font-extrabold">{message.subject}</p>
            <p className="text-sm font-bold">To {message.to}</p>
            <pre className="mt-2 whitespace-pre-wrap font-sans text-sm">{message.body}</pre>
          </li>
        ))}
      </ul>
    </main>
  );
}
