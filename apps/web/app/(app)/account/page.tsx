"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import styles from "./account.module.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface Profile {
  id: string; email: string; name?: string; avatarUrl?: string;
  referralCode: string; createdAt: string;
  streak?: { currentStreak: number; longestStreak: number };
  subscription?: { status: string | null; trialEndsAt: string | null; currentPeriodEnd: string | null };
}

function statusBadge(status: string | null) {
  if (status === "trialing") return { label: "Free Trial", color: "#4A7C59" };
  if (status === "active") return { label: "Pro", color: "#7B5EA7" };
  return { label: "Free", color: "#A89480" };
}

export default function AccountPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.push("/auth/login"); return; }
      const t = data.session.access_token;
      setToken(t);
      try {
        const res = await fetch(`${API_URL}/api/account`, {
          headers: { Authorization: `Bearer ${t}` },
        });
        if (res.ok) {
          const json = await res.json() as { user: Profile };
          setProfile(json.user);
          setName(json.user.name ?? "");
        }
      } finally {
        setLoading(false);
      }
    });
  }, [router]);

  async function saveName() {
    if (!token) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/account`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const json = await res.json() as { user: Profile };
        setProfile(json.user);
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading) return <div className={styles.loadingPage}>Loading...</div>;

  const sub = profile?.subscription;
  const badge = statusBadge(sub?.status ?? null);
  const streak = profile?.streak;

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <Link href="/dashboard" className={styles.logo}>✝ BibleGPT</Link>
        <div className={styles.navLinks}>
          <Link href="/bible">Bible</Link>
          <Link href="/ai">AI Chat</Link>
          <Link href="/account" className={styles.navActive}>Account</Link>
        </div>
      </nav>

      <main className={styles.main}>
        <div className={styles.grid}>
          {/* Profile Card */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Profile</h2>
            <div className={styles.avatar}>
              {(profile?.name ?? profile?.email ?? "?")[0].toUpperCase()}
            </div>
            <div className={styles.field}>
              <span className={styles.label}>Email</span>
              <span className={styles.value}>{profile?.email}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>Name</span>
              {editing ? (
                <div className={styles.editRow}>
                  <input
                    className={styles.nameInput}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your name"
                  />
                  <button className={styles.saveBtn} onClick={saveName} disabled={saving}>
                    {saving ? "..." : "Save"}
                  </button>
                  <button className={styles.cancelBtn} onClick={() => setEditing(false)}>Cancel</button>
                </div>
              ) : (
                <div className={styles.editRow}>
                  <span className={styles.value}>{profile?.name || "Not set"}</span>
                  <button className={styles.editBtn} onClick={() => setEditing(true)}>Edit</button>
                </div>
              )}
            </div>
            {streak && (
              <div className={styles.streakRow}>
                <div className={styles.streakStat}>
                  <span className={styles.streakNum}>🔥 {streak.currentStreak}</span>
                  <span className={styles.streakLabel}>Day Streak</span>
                </div>
                <div className={styles.streakStat}>
                  <span className={styles.streakNum}>⭐ {streak.longestStreak}</span>
                  <span className={styles.streakLabel}>Best Streak</span>
                </div>
              </div>
            )}
          </div>

          {/* Subscription Card */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Subscription</h2>
            <div className={styles.subStatus} style={{ background: badge.color + "18", borderColor: badge.color + "44" }}>
              <span className={styles.subBadge} style={{ background: badge.color }}>{badge.label}</span>
              <span className={styles.subDesc}>
                {sub?.status === "trialing" && sub.trialEndsAt
                  ? `Trial ends ${new Date(sub.trialEndsAt).toLocaleDateString("en-US", { month: "long", day: "numeric" })}`
                  : sub?.status === "active" && sub.currentPeriodEnd
                  ? `Renews ${new Date(sub.currentPeriodEnd).toLocaleDateString("en-US", { month: "long", day: "numeric" })}`
                  : "Start your 7-day free trial"}
              </span>
            </div>

            {(!sub?.status || sub.status === "canceled") && (
              <Link href="/pricing" className={styles.upgradeBtn}>
                Start Free Trial →
              </Link>
            )}

            {sub?.status === "trialing" && (
              <p className={styles.subNote}>
                Your trial is active. You have full access to all features.
              </p>
            )}

            {sub?.status === "active" && (
              <p className={styles.subNote}>
                You have an active Pro subscription with full access.
              </p>
            )}

            <div className={styles.referralBox}>
              <span className={styles.label}>Referral Code</span>
              <div className={styles.referralCode}>{profile?.referralCode}</div>
              <p className={styles.referralNote}>Share this code — both you and a friend get a bonus when they subscribe.</p>
            </div>
          </div>
        </div>

        {/* Sign Out */}
        <div className={styles.actions}>
          <button className={styles.signOutBtn} onClick={signOut}>Sign Out</button>
        </div>
      </main>
    </div>
  );
}
