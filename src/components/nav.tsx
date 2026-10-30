"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/home", label: "Home", icon: "🏠" },
  { href: "/discover", label: "Discover", icon: "🔎" },
  { href: "/gifts", label: "Gifts", icon: "🎁" },
  { href: "/profile", label: "Profile", icon: "🍋" },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed bottom-0 left-1/2 z-20 flex w-full max-w-[430px] -translate-x-1/2 border-t-2 border-lemon-200 bg-white/95 px-2 py-2 backdrop-blur">
      {ITEMS.map((item) => {
        const active = path === item.href || path.startsWith(`${item.href}/`);
        return (
          <Link key={item.href} href={item.href} data-active={active} className="nav-link">
            <span className={`grid h-8 w-8 place-items-center rounded-full text-lg ${active ? "bg-lemon-200" : ""}`}>{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
