"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import styles from "../auth.module.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email, password, options: { data: { name } },
      });
      if (signUpError) throw signUpError;

      // Create DB user record
      const token = data.session?.access_token;
      if (token) {
        await fetch(`${API_URL}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ referralCode: referralCode || undefined }),
        });
      }

      router.push("/(app)/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.logo}>✝ BibleGPT</h1>
        <h2 className={styles.title}>Start your free trial</h2>
        <div className={styles.trialBadge}>✓ 7 days free — no charge until trial ends</div>

        <form onSubmit={handleRegister} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}
          <label>Name (optional)
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </label>
          <label>Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
          </label>
          <label>Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Min. 8 characters" minLength={8} />
          </label>
          <label>Referral Code (optional)
            <input type="text" value={referralCode} onChange={(e) => setReferralCode(e.target.value.toUpperCase())} placeholder="e.g. AB12CD34" />
          </label>
          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? "Creating account..." : "Create Account →"}
          </button>
        </form>

        <p className={styles.switchText}>
          Already have an account? <Link href="/auth/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
