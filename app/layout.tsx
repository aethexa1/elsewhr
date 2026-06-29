// elsewhr — font setup
// Replace the contents of app/layout.tsx with this.
// It loads Syne (display) + Space Grotesk (body) so the page looks like elsewhr, not default.

import type { Metadata } from "next";
import { Syne, Space_Grotesk } from "next/font/google";
import "./globals.css";

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
        className={`${syne.variable} ${spaceGrotesk.variable}`}
        style={{ fontFamily: "var(--font-space), sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}
