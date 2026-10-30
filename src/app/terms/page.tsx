import { Screen } from "@/components/chrome";

export default function TermsPage() {
  return (
    <main>
      <Screen title="Terms" subtitle="Community guidelines" back={{ href: "/" }}>
        <article className="space-y-3 px-5 py-4 text-sm font-semibold leading-relaxed">
          <p>Lemonade is for students at the school whose email they can verify. Be kind. No harassment, no polls about teachers or anyone who hasn&apos;t joined, and no trying to unmask an anonymous gift outside the report tools.</p>
          <p>Gems and stars are play currency. Checkout in this build is a test stub and moves no real money.</p>
          <p>We can suspend an account that breaks these rules. You can export or delete your data from Settings.</p>
        </article>
      </Screen>
    </main>
  );
}
