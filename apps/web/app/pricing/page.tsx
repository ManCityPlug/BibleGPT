import Link from "next/link";
import styles from "./pricing.module.css";

export default function PricingPage() {
  return (
    <div className={styles.container}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>✝ BibleGPT</Link>
        <Link href="/auth/login" className={styles.loginLink}>Sign In</Link>
      </nav>

      <main className={styles.main}>
        <h1 className={styles.title}>BibleGPT Pro</h1>
        <p className={styles.sub}>Deepen your faith. Start with a 7-day free trial.</p>

        <div className={styles.cards}>
          <div className={styles.card}>
            <h2>Monthly</h2>
            <div className={styles.price}>$7.99<span>/month</span></div>
            <Link href="/auth/register" className={styles.cta}>Start Free Trial</Link>
          </div>
          <div className={`${styles.card} ${styles.featured}`}>
            <div className={styles.badge}>Best Value — Save 37%</div>
            <h2>Yearly</h2>
            <div className={styles.price}>$59.99<span>/year</span></div>
            <p className={styles.note}>Just $5.00/month</p>
            <Link href="/auth/register" className={`${styles.cta} ${styles.ctaGold}`}>Start Free Trial</Link>
          </div>
        </div>

        <div className={styles.features}>
          <h3>Everything included:</h3>
          {[
            "Full KJV Bible with notes & highlights",
            "Unlimited AI Bible conversations (BibleGPT)",
            "Daily devotionals & reading plans",
            "Community groups with real-time chat",
            "Prayer journal & prayer requests",
            "Friends system & direct messaging",
            "Streak tracking & progress insights",
            "iOS, Android & Web access",
          ].map((f) => <p key={f}>✓ {f}</p>)}
        </div>
      </main>
    </div>
  );
}
