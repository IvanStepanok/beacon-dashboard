import type { Metadata } from "next";
import { Noto_Sans, Noto_Sans_Mono, Roboto } from "next/font/google";
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
  weight: ["400", "500", "600", "700", "800"],
});

const notoMono = Noto_Sans_Mono({
  variable: "--font-undp-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

// The landing's phone mockup reproduces the real Android app 1:1 — the app
// renders with the system face (Roboto), so the mockup must too.
const roboto = Roboto({
  variable: "--font-phone",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Beacon — crisis damage mapping by the people on the ground",
  description:
    "Three taps to report building damage, works with zero connectivity, verified by analysts. Community crisis mapping for UNDP response teams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${notoSans.variable} ${notoMono.variable} ${roboto.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans text-ink">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
