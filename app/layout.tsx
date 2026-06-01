import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "MultinetMarket — Análisis de Campañas WhatsApp",
  description: "Dashboard de analítica para campañas masivas de WhatsApp",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className={`${jakarta.variable} font-[family-name:var(--font-jakarta)] min-h-full`}
        style={{ background: "var(--bg)", color: "var(--ink)" }}>

        {/* Header */}
        <header style={{ background: "var(--surface)", borderBottom: "1px solid var(--border-soft)" }}>
          <div className="max-w-6xl mx-auto px-6 h-[84px] flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="MultinetMarket" className="logo-img" />
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ background: "var(--brand-light)", color: "var(--brand)" }}>
                Campañas WhatsApp
              </span>
            </div>
          </div>
        </header>

        {/* Thin brand bar */}
        <div style={{ height: 3, background: "var(--brand)" }} />

        <main className="max-w-6xl mx-auto px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
