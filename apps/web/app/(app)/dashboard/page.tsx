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

export default function DashboardPage() {
  const router = useRouter();
  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.push("/auth/login"); return; }
      const token = data.session.access_token;
      try {
        const res = await fetch(`${API_URL}/api/devotionals/today`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json() as { devotional: Devotional };
          setDevotional(json.devotional);
        }
      } finally {
        setLoading(false);
      }
    });
  }, [router]);

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <nav className={styles.nav}>
        <span className={styles.logo}>✝ BibleGPT</span>
        <div className={styles.navLinks}>
          <Link href="/bible">Bible</Link>
          <Link href="/ai">AI Chat</Link>
          <Link href="/account">Account</Link>
        </div>
      </nav>

      <main className={styles.main}>
        <h1 className={styles.greeting}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </h1>

        {devotional && (
          <div className={styles.devotionalCard}>
            <span className={styles.cardLabel}>TODAY'S DEVOTIONAL</span>
            <h2 className={styles.devTitle}>{devotional.title}</h2>
            <div className={styles.verseBadge}>{devotional.verse}</div>
            <blockquote className={styles.verseText}>"{devotional.verseText}"</blockquote>
            <p className={styles.devContent}>{devotional.content.slice(0, 300)}...</p>
          </div>
        )}

        <div className={styles.quickGrid}>
          {[
            { href: "/bible", icon: "📖", label: "Read Bible" },
            { href: "/ai", icon: "🤖", label: "Ask BibleGPT" },
            { href: "/pricing", icon: "👑", label: "Upgrade Plan" },
            { href: "/account", icon: "👤", label: "My Account" },
          ].map((item) => (
            <Link key={item.href} href={item.href} className={styles.quickCard}>
              <span className={styles.quickIcon}>{item.icon}</span>
              <span className={styles.quickLabel}>{item.label}</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
