import Link from "next/link";
import styles from "./page.module.css";

const FEATURES = [
  { icon: "✝", title: "Full KJV Bible", desc: "Read, search, and study the complete King James Bible with cross-references." },
  { icon: "🤖", title: "AI Bible Assistant", desc: "Ask BibleGPT anything — theology, context, devotional guidance, and more." },
  { icon: "🙏", title: "Community Groups", desc: "Join Bible study groups with real-time chat, prayer sharing, and reading assignments." },
  { icon: "📝", title: "Prayer Journal", desc: "Keep a private journal, track answered prayers, and share with your group." },
  { icon: "📅", title: "Reading Plans", desc: "365-day, 90-day, 60-day, and 30-day plans to guide your study journey." },
  { icon: "👥", title: "Friends & DMs", desc: "Connect with fellow believers and send direct messages." },
];

const PRICING = [
  {
    name: "Monthly",
    price: "$7.99",
    period: "/month",
    highlight: false,
    features: ["Unlimited AI conversations", "Full Bible reader", "All reading plans", "Community groups", "Cancel anytime"],
  },
  {
    name: "Yearly",
    price: "$59.99",
    period: "/year",
    highlight: true,
    badge: "Best Value — Save 37%",
    features: ["Everything in Monthly", "Priority support", "Early access to new features", "$5.00/month effective rate"],
  },
];

export default function LandingPage() {
  return (
    <main className={styles.main}>
      {/* Nav */}
      <nav className={styles.nav}>
        <span className={styles.navLogo}>✝ BibleGPT</span>
        <div className={styles.navLinks}>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <Link href="/auth/login" className={styles.navLogin}>Sign In</Link>
          <Link href="/auth/register" className={styles.navCta}>Start Free Trial</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBadge}>✨ 7-Day Free Trial — No credit card required to start</div>
        <h1 className={styles.heroTitle}>
          Explore the Bible<br />
          <span className={styles.heroAccent}>with AI guidance</span>
        </h1>
        <p className={styles.heroSub}>
          BibleGPT combines the full King James Bible with a powerful AI assistant, community groups,
          reading plans, and a prayer journal — all in one place.
        </p>
        <div className={styles.heroCtas}>
          <Link href="/auth/register" className={styles.ctaPrimary}>Start 7-Day Free Trial →</Link>
          <Link href="/auth/login" className={styles.ctaSecondary}>Sign In</Link>
        </div>
        <p className={styles.heroNote}>Available on iOS, Android, and Web</p>
      </section>

      {/* Features */}
      <section id="features" className={styles.features}>
        <h2 className={styles.sectionTitle}>Everything you need for deeper Bible study</h2>
        <div className={styles.featureGrid}>
          {FEATURES.map((f) => (
            <div key={f.title} className={styles.featureCard}>
              <span className={styles.featureIcon}>{f.icon}</span>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className={styles.pricing}>
        <h2 className={styles.sectionTitle}>Simple, transparent pricing</h2>
        <p className={styles.pricingSub}>Start with a 7-day free trial. No charge until your trial ends.</p>
        <div className={styles.pricingGrid}>
          {PRICING.map((plan) => (
            <div key={plan.name} className={`${styles.pricingCard} ${plan.highlight ? styles.pricingCardHighlight : ""}`}>
              {plan.badge && <div className={styles.pricingBadge}>{plan.badge}</div>}
              <h3 className={styles.pricingName}>{plan.name}</h3>
              <div className={styles.pricingPrice}>
                {plan.price}<span className={styles.pricingPeriod}>{plan.period}</span>
              </div>
              <ul className={styles.pricingFeatures}>
                {plan.features.map((f) => (
                  <li key={f}><span className={styles.check}>✓</span> {f}</li>
                ))}
              </ul>
              <Link href="/auth/register" className={plan.highlight ? styles.ctaPrimary : styles.ctaOutline}>
                Start Free Trial
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} MITEV LLC. All rights reserved.</p>
        <p>BibleGPT uses the King James Version (KJV) — public domain.</p>
      </footer>
    </main>
  );
}
