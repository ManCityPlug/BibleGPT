import type { Metadata } from "next";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "BibleGPT — AI-Powered Bible Study",
  description: "Explore the Holy Bible with AI assistance. Daily devotionals, reading plans, community groups, and prayer journal.",
  keywords: ["Bible", "AI", "Bible study", "devotional", "KJV", "Christian", "prayer"],
  openGraph: {
    title: "BibleGPT — AI-Powered Bible Study",
    description: "Explore the Holy Bible with AI assistance",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
