// elsewhr — font setup + language provider
// Replaces app/layout.tsx

import type { Metadata } from "next";
import { Syne, Space_Grotesk, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import LangProvider from "./LangProvider";

const syne = Syne({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-syne",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space",
});

// so Hindi renders as words, not boxes
const devanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "500", "700"],
  variable: "--font-deva",
});

export const metadata: Metadata = {
  title: "elsewhr",
  description: "Show your work. Get seen for what you can actually do.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${syne.variable} ${spaceGrotesk.variable} ${devanagari.variable}`}
        style={{
          fontFamily:
            "var(--font-space), var(--font-deva), sans-serif",
        }}
      >
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  );
}
