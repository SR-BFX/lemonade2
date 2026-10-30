import type { Metadata, Viewport } from "next";
import { PwaRegister } from "@/components/pwa";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lemonade",
  description: "Sweet connections at school. A life sim for students who join themselves.",
  applicationName: "Lemonade",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "Lemonade", statusBarStyle: "default" },
  icons: { icon: "/icon.svg", apple: "/icon-192.png" },
};

export const viewport: Viewport = {
  themeColor: "#FFE566",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@500;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans text-ink antialiased">
        <PwaRegister />
        <div className="phone mx-auto max-w-[430px] shadow-2xl">{children}</div>
      </body>
    </html>
  );
}
