import Link from "next/link";
import styles from "./page.module.css";

const FEATURES = [
  { icon: "📖", title: "Full KJV Bible", desc: "Read, search, and study all 66 books of the King James Bible with verse-by-verse navigation and highlights." },
  { icon: "🤖", title: "AI Bible Companion", desc: "Ask anything — theology, context, devotional guidance — and receive scripture-backed answers from the KJV, instantly." },
  { icon: "🙏", title: "Community Groups", desc: "Join Bible study groups with real-time chat, shared reading assignments, and prayer request boards." },
  { icon: "📝", title: "Prayer Journal", desc: "Record prayers, mark answered ones, and optionally share with your group for collective intercession." },
  { icon: "📅", title: "Reading Plans", desc: "365-day, 90-day, 60-day, and 30-day guided plans to keep you consistently in the Word." },
  { icon: "👥", title: "Friends & Messages", desc: "Connect with fellow believers, share encouraging verses, and send direct messages." },
];

const MOCK_CHAT = [
  { role: "user", text: "What does John 3:16 mean for my life today?" },
  {
    role: "ai",
    text: "\"For God so loved the world, that he gave his only begotten Son\" — the word 'world' includes you personally. His love isn't earned by your performance. Today it means you are fully known, fully loved, and never alone.",
  },
  { role: "user", text: "Give me a verse about overcoming fear" },
  {
    role: "ai",
    text: "\"For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.\" — 2 Timothy 1:7 (KJV). Fear is not from God — courage, love, and clarity are His gifts to you right now.",
  },
];

export default function LandingPage() {
  return (
    <main className={styles.main}>

      {/* ── Nav ─────────────────────────────────────────── */}
      <nav className={styles.nav}>
        <Link href="/" className={styles.navLogo}>
          <span className={styles.navLogoIcon}>✝</span>
          BibleGPT
        </Link>
        <div className={styles.navLinks}>
          <a href="#features" className={styles.navTextLink}>Features</a>
          <a href="#ai" className={styles.navTextLink}>AI Chat</a>
          <Link href="/auth/login" className={styles.navLogin}>Sign In</Link>
          <Link href="/auth/register" className={styles.navCta}>Try for Free</Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className={styles.heroWrap}>
        <div className={styles.hero}>
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>✦ Your AI Bible Companion</div>
            <h1 className={styles.heroTitle}>
              Explore God's Word<br />
              <span className={styles.heroAccent}>Like Never Before</span>
            </h1>
            <p className={styles.heroSub}>
              BibleGPT brings the complete King James Bible to life — AI answers, guided reading plans, community groups, and a prayer journal, all in one place.
            </p>
            <div className={styles.heroCtas}>
              <Link href="/auth/register" className={styles.ctaPrimary}>
                Try BibleGPT for Free →
              </Link>
              <a href="#features" className={styles.ctaGhost}>See what's inside</a>
            </div>
            <p className={styles.heroNote}>No credit card required · Cancel anytime</p>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.chatCard}>
              <div className={styles.chatHeader}>
                <div className={styles.chatDots}>
                  <span /><span /><span />
                </div>
                <span className={styles.chatTitle}>✝ BibleGPT</span>
              </div>
              <div className={styles.chatBody}>
                {MOCK_CHAT.map((m, i) => (
                  <div key={i} className={m.role === "user" ? styles.chatUser : styles.chatAi}>
                    {m.role === "ai" && <span className={styles.chatAiLabel}>BibleGPT</span>}
                    <p className={styles.chatText}>{m.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────────── */}
      <div className={styles.statsBar}>
        {[
          { num: "66", label: "Books of the Bible" },
          { num: "31,102", label: "KJV Verses" },
          { num: "7-Day", label: "Free Trial" },
        ].map((s) => (
          <div key={s.label} className={styles.statItem}>
            <span className={styles.statNum}>{s.num}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Features ─────────────────────────────────────── */}
      <section id="features" className={styles.featuresWrap}>
        <div className={styles.sectionHeader}>
          <span className={styles.eyebrow}>EVERYTHING YOU NEED</span>
          <h2 className={styles.sectionTitle}>A complete Bible study experience</h2>
          <p className={styles.sectionSub}>
            From daily devotionals to deep theological questions — BibleGPT has you covered.
          </p>
        </div>
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

      {/* ── AI Showcase ───────────────────────────────────── */}
      <section id="ai" className={styles.aiWrap}>
        <div className={styles.aiInner}>
          <div className={styles.aiText}>
            <span className={styles.eyebrowLight}>AI BIBLE COMPANION</span>
            <h2 className={styles.aiTitle}>Ask anything.<br />Get scripture-backed answers.</h2>
            <p className={styles.aiSub}>
              Our AI is focused entirely on the Bible and Christian faith — always quoting the King James Version. Like having a wise, knowledgeable pastor available 24/7.
            </p>
            <ul className={styles.aiList}>
              <li><span className={styles.bullet}>✦</span> Explains any verse in plain language</li>
              <li><span className={styles.bullet}>✦</span> Finds scripture for any life situation</li>
              <li><span className={styles.bullet}>✦</span> Covers theology, history &amp; prophecy</li>
              <li><span className={styles.bullet}>✦</span> Always quotes KJV scripture verbatim</li>
            </ul>
            <Link href="/auth/register" className={styles.ctaPrimary}>Try BibleGPT for Free →</Link>
          </div>
          <div className={styles.aiVisual}>
            <div className={styles.verseCard}>
              <span className={styles.verseEyebrow}>✦ VERSE OF THE DAY</span>
              <blockquote className={styles.verseQuote}>
                "For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end."
              </blockquote>
              <span className={styles.verseRef}>— Jeremiah 29:11 (KJV)</span>
            </div>
            <div className={styles.verseCard} style={{ marginTop: "16px" }}>
              <span className={styles.verseEyebrow}>✦ TODAY'S DEVOTIONAL</span>
              <blockquote className={styles.verseQuote}>
                "Trust in the LORD with all thine heart; and lean not unto thine own understanding."
              </blockquote>
              <span className={styles.verseRef}>— Proverbs 3:5 (KJV)</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────── */}
      <section className={styles.ctaBannerWrap}>
        <div className={styles.ctaBanner}>
          <h2 className={styles.bannerTitle}>Begin your journey through God's Word today</h2>
          <p className={styles.bannerSub}>7-day free trial · No credit card required · Available on iOS, Android &amp; Web</p>
          <Link href="/auth/register" className={styles.ctaBannerBtn}>Try BibleGPT for Free →</Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className={styles.footer}>
        <div className={styles.footerLeft}>
          <span className={styles.footerLogo}>✝ BibleGPT</span>
          <p>© {new Date().getFullYear()} MITEV LLC. All rights reserved.</p>
          <p>Uses the King James Version (KJV) — public domain.</p>
        </div>
        <div className={styles.footerRight}>
          <Link href="/auth/login">Sign In</Link>
          <Link href="/auth/register">Start Free Trial</Link>
        </div>
      </footer>

    </main>
  );
}
