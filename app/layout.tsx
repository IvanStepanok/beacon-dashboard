import type { Metadata } from "next";
import { Noto_Sans, Noto_Sans_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";

// UNDP Design System body type is ProximaNova; its own non-Latin fallback is Noto
// Sans (free, on Google Fonts, and covers all 6 UN scripts incl. Arabic/CJK). We
// render with Noto Sans and keep ProximaNova first in the stack for environments
// that have the licensed face installed.
const notoSans = Noto_Sans({
  variable: "--font-undp-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const notoMono = Noto_Sans_Mono({
  variable: "--font-undp-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Beacon · Analyst Console",
  description:
    "Real-time community damage assessment for crisis response — UNDP Beacon analyst console.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${notoSans.variable} ${notoMono.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans text-ink">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
