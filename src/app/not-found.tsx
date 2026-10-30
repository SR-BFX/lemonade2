import Link from "next/link";

export default function NotFound() {
  return (
    <main className="px-5 py-16 text-center">
      <p className="text-5xl">🍋</p>
      <h1 className="mt-2 text-2xl font-extrabold">That page isn't here</h1>
      <Link href="/" className="btn-lemon mt-6">Back to Lemonade</Link>
    </main>
  );
}
