import type { ReactNode } from "react";
import Link from "next/link";

export function Flash({ error, notice }: { error?: string; notice?: string }) {
  if (!error && !notice) return null;
  return (
    <p className={error ? "mx-4 mt-3 rounded-2xl bg-blush/10 px-3 py-2 text-sm font-bold text-blush" : "mx-4 mt-3 rounded-2xl bg-leaf/10 px-3 py-2 text-sm font-bold text-leaf"}>
      {error || notice}
    </p>
  );
}

export function Back({ href, label = "Back" }: { href: string; label?: string }) {
  return (
    <Link href={href} className="text-sm font-extrabold text-ink/70">
      ← {label}
    </Link>
  );
}

export function Screen({
  title,
  subtitle,
  back,
  children,
  lemon = true,
}: {
  title: string;
  subtitle?: string;
  back?: { href: string; label?: string };
  children: ReactNode;
  lemon?: boolean;
}) {
  return (
    <div>
      <header className={lemon ? "bg-gradient-to-b from-lemon-200 to-lemon-100 px-5 pb-4 pt-6" : "px-5 pb-2 pt-6"}>
        {back ? <Back href={back.href} label={back.label} /> : null}
        <h1 className="text-2xl font-extrabold leading-tight">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm font-bold text-ink/70">{subtitle}</p> : null}
      </header>
      {children}
    </div>
  );
}

export function Counter({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex-1 text-center">
      <div className="text-xl font-extrabold">{value}</div>
      <div className="text-[11px] font-bold text-ink/60">{label}</div>
    </div>
  );
}
