"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import styles from "./PopupBanner.module.css";

export default function PopupBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show if dismissed in last 7 days
    const dismissed = localStorage.getItem("biblegpt_popup_dismissed");
    if (dismissed && Date.now() - Number(dismissed) < 7 * 24 * 60 * 60 * 1000) return;

    // Don't show if already signed in
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) return;
      const timer = setTimeout(() => setVisible(true), 20000);
      return () => clearTimeout(timer);
    });
  }, []);

  function dismiss() {
    localStorage.setItem("biblegpt_popup_dismissed", String(Date.now()));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className={styles.overlay} onClick={dismiss}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.close} onClick={dismiss} aria-label="Close">✕</button>

        {/* Top visual */}
        <div className={styles.visual}>
          <div className={styles.visualBg} />
          <div className={styles.visualContent}>
            <span className={styles.cross}>✝</span>
            <span className={styles.visualTag}>7-DAY FREE TRIAL</span>
          </div>
        </div>

        {/* Body */}
        <div className={styles.body}>
          <h2 className={styles.title}>
            Deepen Your Faith with the Power of Scripture
          </h2>
          <p className={styles.sub}>
            Join thousands of believers exploring God's Word every day with BibleGPT — the AI-powered Bible companion built on the King James Version.
          </p>

          <ul className={styles.bullets}>
            <li><span className={styles.check}>✓</span> Daily KJV verse &amp; devotional</li>
            <li><span className={styles.check}>✓</span> Unlimited AI Bible Q&amp;A</li>
            <li><span className={styles.check}>✓</span> Guided reading plans &amp; prayer journal</li>
            <li><span className={styles.check}>✓</span> Community Bible study groups</li>
          </ul>

          <Link href="/auth/register" className={styles.cta} onClick={dismiss}>
            Get 7 Days Free
          </Link>

          <p className={styles.stars}>★★★★★&nbsp; Loved by believers worldwide</p>

          <p className={styles.signin}>
            Already have an account?{" "}
            <Link href="/auth/login" onClick={dismiss} className={styles.signinLink}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
