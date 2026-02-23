"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import styles from "./BottomBar.module.css";

export default function BottomBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("biblegpt_bar_dismissed");
    if (dismissed && Date.now() - Number(dismissed) < 3 * 24 * 60 * 60 * 1000) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) return;
      const t = setTimeout(() => setVisible(true), 20000);
      return () => clearTimeout(t);
    });
  }, []);

  function dismiss() {
    localStorage.setItem("biblegpt_bar_dismissed", String(Date.now()));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className={styles.bar}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <span className={styles.cross}>✝</span>
          <div>
            <p className={styles.title}>Start reading the Bible with AI guidance</p>
            <p className={styles.sub}>★★★★★ &nbsp;Loved by believers worldwide · Free to start</p>
          </div>
        </div>
        <div className={styles.actions}>
          <Link href="/auth/register" className={styles.cta}>Get Started for Free</Link>
          <button className={styles.close} onClick={dismiss} aria-label="Close">✕</button>
        </div>
      </div>
    </div>
  );
}
