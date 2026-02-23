"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import styles from "./dashboard.module.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface Devotional {
  id: string; title: string; verse: string; verseText: string; content: string;
}

const FALLBACK_VERSES = [
  { verse: "John 3:16", verseText: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life." },
  { verse: "Philippians 4:13", verseText: "I can do all things through Christ which strengtheneth me." },
  { verse: "Psalm 23:1", verseText: "The LORD is my shepherd; I shall not want." },
  { verse: "Romans 8:28", verseText: "And we know that all things work together for good to them that love God, to them who are the called according to his purpose." },
  { verse: "Proverbs 3:5", verseText: "Trust in the LORD with all thine heart; and lean not unto thine own understanding." },
  { verse: "Isaiah 40:31", verseText: "But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary." },
  { verse: "Joshua 1:9", verseText: "Be strong and courageous. Do not be frightened, and do not be dismayed, for the LORD your God is with you wherever you go." },
];

function getDailyFallback() {
  const day = Math.floor(Date.now() / 86400000);
  return FALLBACK_VERSES[day % FALLBACK_VERSES.length];
}

export default function DashboardPage() {
  const router = useRouter();
  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [fallback, setFallback] = useState<{ verse: string; verseText: string } | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.push("/auth/login"); return; }
      const token = data.session.access_token;
      const meta = data.session.user?.user_metadata as { name?: string } | undefined;
      setUserName(meta?.name ?? data.session.user?.email?.split("@")[0] ?? "");

      try {
        const res = await fetch(`${API_URL}/api/devotionals/today`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json() as { devotional: Devotional };
          setDevotional(json.devotional);
        } else {
          setFallback(getDailyFallback());
        }
      } catch {
        setFallback(getDailyFallback());
      } finally {
        setLoading(false);
      }
    });
  }, [router]);

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className={styles.container}>
      <nav className={styles.nav}>
        <span className={styles.logo}>✝ BibleGPT</span>
        <div className={styles.navLinks}>
          <Link href="/bible">Bible</Link>
          <Link href="/ai">AI Chat</Link>
          <Link href="/account">Account</Link>
        </div>
        <button className={styles.signOutBtn} onClick={async () => { await supabase.auth.signOut(); router.push("/"); }}>
          Sign Out
        </button>
      </nav>

      <main className={styles.main}>
        <div className={styles.topRow}>
          <div>
            <p className={styles.dateLabel}>{today}</p>
            <h1 className={styles.greeting}>
              {userName ? `Good morning, ${userName}` : "Good morning"}
            </h1>
          </div>
        </div>

        <div className={styles.twoCol}>
          {/* Left: Verse / Devotional */}
          <div className={styles.leftCol}>
            {devotional ? (
              <div className={styles.devotionalCard}>
                <span className={styles.cardLabel}>TODAY'S DEVOTIONAL</span>
                <h2 className={styles.devTitle}>{devotional.title}</h2>
                <div className={styles.verseBadge}>{devotional.verse}</div>
                <blockquote className={styles.verseText}>"{devotional.verseText}"</blockquote>
                <p className={styles.devContent}>{devotional.content.slice(0, 280)}...</p>
              </div>
            ) : fallback ? (
              <div className={styles.verseCard}>
                <span className={styles.cardLabel}>VERSE OF THE DAY</span>
                <div className={styles.verseBadge}>{fallback.verse}</div>
                <blockquote className={styles.verseText}>"{fallback.verseText}"</blockquote>
                <Link href="/bible" className={styles.readMoreLink}>Read in Bible →</Link>
              </div>
            ) : null}
          </div>

          {/* Right: Quick Actions */}
          <div className={styles.rightCol}>
            <h3 className={styles.sectionTitle}>Quick Access</h3>
            <div className={styles.quickGrid}>
              {[
                { href: "/bible", icon: "📖", label: "Read Bible", desc: "66 books, all translations" },
                { href: "/ai", icon: "🤖", label: "Ask BibleGPT", desc: "AI-powered Bible study" },
                { href: "/account", icon: "👑", label: "My Subscription", desc: "Manage your plan" },
                { href: "/account", icon: "👤", label: "My Account", desc: "Profile & settings" },
              ].map((item) => (
                <Link key={`${item.href}-${item.label}`} href={item.href} className={styles.quickCard}>
                  <span className={styles.quickIcon}>{item.icon}</span>
                  <div>
                    <span className={styles.quickLabel}>{item.label}</span>
                    <span className={styles.quickDesc}>{item.desc}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
