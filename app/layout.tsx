import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";

/**
 * A single grotesque, used across the whole site at widely separated weights
 * and tracking values. High-fashion identities almost always work this way:
 * one voice, many volumes.
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "800", "900"],
});

export const metadata: Metadata = {
  title: "VANTA — Fashion That Moves With You",
  description:
    "An interactive editorial runway. New collection 2026, shot in monochrome.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-bone text-ink antialiased">
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
