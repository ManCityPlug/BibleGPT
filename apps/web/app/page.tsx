import Link from "next/link";
import styles from "./page.module.css";
import PopupBanner from "./components/PopupBanner";

// ── Rotating verse of the day (server-side, deterministic by date) ──
const DAILY_VERSES = [
  { text: "For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.", ref: "Jeremiah 29:11" },
  { text: "Trust in the LORD with all thine heart; and lean not unto thine own understanding.", ref: "Proverbs 3:5" },
  { text: "I can do all things through Christ which strengtheneth me.", ref: "Philippians 4:13" },
  { text: "The LORD is my shepherd; I shall not want.", ref: "Psalm 23:1" },
  { text: "Be strong and courageous. Do not be afraid; do not be discouraged, for the LORD your God will be with thee.", ref: "Joshua 1:9" },
  { text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.", ref: "John 3:16" },
  { text: "Come unto me, all ye that labour and are heavy laden, and I will give you rest.", ref: "Matthew 11:28" },
  { text: "But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles.", ref: "Isaiah 40:31" },
  { text: "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.", ref: "Philippians 4:6" },
  { text: "For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.", ref: "2 Timothy 1:7" },
  { text: "The LORD is my light and my salvation; whom shall I fear? the LORD is the strength of my life; of whom shall I be afraid?", ref: "Psalm 27:1" },
  { text: "And we know that all things work together for good to them that love God.", ref: "Romans 8:28" },
  { text: "Thy word is a lamp unto my feet, and a light unto my path.", ref: "Psalm 119:105" },
  { text: "Create in me a clean heart, O God; and renew a right spirit within me.", ref: "Psalm 51:10" },
  { text: "In the beginning was the Word, and the Word was with God, and the Word was God.", ref: "John 1:1" },
  { text: "The name of the LORD is a strong tower: the righteous runneth into it, and is safe.", ref: "Proverbs 18:10" },
  { text: "Casting all your care upon him; for he careth for you.", ref: "1 Peter 5:7" },
  { text: "Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you.", ref: "John 14:27" },
  { text: "The LORD bless thee, and keep thee: The LORD make his face shine upon thee, and be gracious unto thee.", ref: "Numbers 6:24-25" },
  { text: "Delight thyself also in the LORD: and he shall give thee the desires of thine heart.", ref: "Psalm 37:4" },
  { text: "If ye abide in me, and my words abide in you, ye shall ask what ye will, and it shall be done unto you.", ref: "John 15:7" },
  { text: "The heart of man plans his way, but the LORD establishes his steps.", ref: "Proverbs 16:9" },
  { text: "Blessed are the pure in heart: for they shall see God.", ref: "Matthew 5:8" },
  { text: "Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed.", ref: "Joshua 1:9" },
  { text: "This is the day which the LORD hath made; we will rejoice and be glad in it.", ref: "Psalm 118:24" },
  { text: "Seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.", ref: "Matthew 6:33" },
  { text: "Draw nigh to God, and he will draw nigh to you.", ref: "James 4:8" },
  { text: "Greater is he that is in you, than he that is in the world.", ref: "1 John 4:4" },
  { text: "No weapon that is formed against thee shall prosper.", ref: "Isaiah 54:17" },
  { text: "The LORD is good, a strong hold in the day of trouble; and he knoweth them that trust in him.", ref: "Nahum 1:7" },
];

function getDailyVerse() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return DAILY_VERSES[dayOfYear % DAILY_VERSES.length];
}

const FEATURES = [
  { icon: "📖", title: "Full KJV Bible", desc: "All 66 books, 31,102 verses. Read, search, highlight and take notes verse-by-verse." },
  { icon: "🤖", title: "AI Bible Companion", desc: "Ask anything about scripture — theology, context, devotionals — and get KJV-backed answers instantly." },
  { icon: "🙏", title: "Community Groups", desc: "Join Bible study groups with real-time chat, reading assignments, and shared prayer boards." },
  { icon: "📝", title: "Prayer Journal", desc: "Record prayers, track when God answers them, and optionally share with your group." },
  { icon: "📅", title: "Reading Plans", desc: "365-day, 90-day, 60-day, and 30-day plans to keep you consistently in the Word." },
  { icon: "👥", title: "Friends & Messages", desc: "Connect with fellow believers, share encouraging verses, and send direct messages." },
];

const STEPS = [
  { num: "01", title: "Create your free account", desc: "Sign up in under 30 seconds — no credit card needed to start your 7-day trial." },
  { num: "02", title: "Start reading or ask BibleGPT", desc: "Open any chapter of the KJV or ask the AI your first question about scripture." },
  { num: "03", title: "Build a daily habit", desc: "Track your streak, write in your prayer journal, and grow with your community." },
];

const TESTIMONIALS = [
  { name: "Sarah M.", role: "Daily Bible reader", quote: "BibleGPT has completely transformed my morning devotionals. The AI explains passages in a way that finally makes them click for me.", stars: 5 },
  { name: "James T.", role: "Pastor & group leader", quote: "I use the community groups feature with my congregation. The reading assignments and prayer board keep everyone engaged through the week.", stars: 5 },
  { name: "Priya K.", role: "New believer", quote: "I was intimidated to read the Bible alone. BibleGPT's AI answered every 'beginner' question I had without judgement. Life-changing.", stars: 5 },
];

const MOCK_CHAT = [
  { role: "user", text: "What does John 3:16 mean for my life today?" },
  { role: "ai", text: "\"For God so loved the world, that he gave his only begotten Son\" — the word 'world' includes you personally. His love isn't conditional on your performance. Today it means you are fully known, fully loved, and never alone." },
  { role: "user", text: "Give me a verse about overcoming fear" },
  { role: "ai", text: "\"For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.\" — 2 Timothy 1:7 (KJV). Fear is not from God — courage, love, and clarity are His gifts to you right now." },
];

export default function LandingPage() {
  const verse = getDailyVerse();
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <main className={styles.main}>
      <PopupBanner />

      {/* ── Nav ── */}
      <nav className={styles.nav}>
        <Link href="/" className={styles.navLogo}>
          <span className={styles.navLogoIcon}>✝</span>
          BibleGPT
        </Link>
        <div className={styles.navLinks}>
          <a href="#features" className={styles.navTextLink}>Features</a>
          <a href="#ai" className={styles.navTextLink}>AI Chat</a>
          <Link href="/auth/login" className={styles.navLogin}>Sign In</Link>
          <Link href="/auth/register" className={styles.navCta}>Start for Free</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className={styles.heroWrap}>
        <div className={styles.hero}>
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>✦ Your AI Bible Companion</div>
            <h1 className={styles.heroTitle}>
              Explore God's Word<br />
              <span className={styles.heroAccent}>Like Never Before</span>
            </h1>
            <p className={styles.heroSub}>
              BibleGPT brings the complete King James Bible to life — AI answers rooted in scripture, guided reading plans, community groups, and a prayer journal, all in one place.
            </p>
            <div className={styles.heroCtas}>
              <Link href="/auth/register" className={styles.ctaPrimary}>Start for Free →</Link>
              <a href="#how" className={styles.ctaGhost}>How it works</a>
            </div>
            <p className={styles.heroNote}>No credit card required · Cancel anytime</p>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.chatCard}>
              <div className={styles.chatHeader}>
                <div className={styles.chatDots}><span /><span /><span /></div>
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

      {/* ── Verse of the Day ── */}
      <section className={styles.verseOfDayWrap}>
        <div className={styles.verseOfDay}>
          <span className={styles.verseEyebrow}>✦ VERSE OF THE DAY · {today.toUpperCase()}</span>
          <blockquote className={styles.verseOfDayText}>
            "{verse.text}"
          </blockquote>
          <span className={styles.verseOfDayRef}>— {verse.ref} (KJV)</span>
          <Link href="/auth/register" className={styles.verseCtaLink}>
            Read today's devotional →
          </Link>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how" className={styles.howWrap}>
        <div className={styles.sectionHeader}>
          <span className={styles.eyebrow}>GETTING STARTED</span>
          <h2 className={styles.sectionTitle}>Up and running in minutes</h2>
        </div>
        <div className={styles.stepsGrid}>
          {STEPS.map((s) => (
            <div key={s.num} className={styles.stepCard}>
              <span className={styles.stepNum}>{s.num}</span>
              <h3 className={styles.stepTitle}>{s.title}</h3>
              <p className={styles.stepDesc}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Stats bar ── */}
      <div className={styles.statsBar}>
        {[
          { num: "66", label: "Books of the Bible" },
          { num: "31,102", label: "KJV Verses" },
          { num: "100%", label: "Free to Start" },
        ].map((s) => (
          <div key={s.label} className={styles.statItem}>
            <span className={styles.statNum}>{s.num}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Features ── */}
      <section id="features" className={styles.featuresWrap}>
        <div className={styles.sectionHeader}>
          <span className={styles.eyebrow}>EVERYTHING YOU NEED</span>
          <h2 className={styles.sectionTitle}>A complete Bible study experience</h2>
          <p className={styles.sectionSub}>From daily devotionals to deep theological questions — BibleGPT has you covered.</p>
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

      {/* ── AI Showcase ── */}
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
            <Link href="/auth/register" className={styles.ctaPrimary}>Start for Free →</Link>
          </div>
          <div className={styles.aiVisual}>
            <div className={styles.verseCard}>
              <span className={styles.verseCardEyebrow}>✦ VERSE OF THE DAY</span>
              <blockquote className={styles.verseCardQuote}>"{verse.text}"</blockquote>
              <span className={styles.verseCardRef}>— {verse.ref} (KJV)</span>
            </div>
            <div className={styles.verseCard} style={{ marginTop: "16px" }}>
              <span className={styles.verseCardEyebrow}>✦ ASK BIBLEGPT</span>
              <blockquote className={styles.verseCardQuote}>"What does this verse mean for me today?"</blockquote>
              <span className={styles.verseCardRef}>— Ask anything, get KJV answers instantly</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className={styles.testimonialsWrap}>
        <div className={styles.sectionHeader}>
          <span className={styles.eyebrow}>WHAT BELIEVERS ARE SAYING</span>
          <h2 className={styles.sectionTitle}>Loved by Christians worldwide</h2>
        </div>
        <div className={styles.testimonialsGrid}>
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className={styles.testimonialCard}>
              <div className={styles.testimonialStars}>{"★".repeat(t.stars)}</div>
              <p className={styles.testimonialQuote}>"{t.quote}"</p>
              <div className={styles.testimonialAuthor}>
                <span className={styles.testimonialName}>{t.name}</span>
                <span className={styles.testimonialRole}>{t.role}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className={styles.ctaBannerWrap}>
        <div className={styles.ctaBanner}>
          <span className={styles.bannerEyebrow}>✦ START FOR FREE</span>
          <h2 className={styles.bannerTitle}>Begin your journey through God's Word today</h2>
          <p className={styles.bannerSub}>No credit card required · Available on iOS, Android &amp; Web</p>
          <Link href="/auth/register" className={styles.ctaBannerBtn}>Start for Free →</Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <div className={styles.footerTop}>
          <div className={styles.footerBrand}>
            <div className={styles.footerLogo}>
              <span className={styles.footerLogoIcon}>✝</span>
              BibleGPT
            </div>
            <p className={styles.footerTagline}>
              Your AI-powered Bible companion. Explore the King James Version with guidance, community, and daily devotion.
            </p>
            <div className={styles.footerActions}>
              <Link href="/auth/login" className={styles.footerSignIn}>Sign In</Link>
              <Link href="/auth/register" className={styles.footerStartBtn}>Start for Free</Link>
            </div>
          </div>

          <div className={styles.footerCol}>
            <p className={styles.footerColTitle}>FEATURES</p>
            <ul>
              <li><a href="#features">KJV Bible Reader</a></li>
              <li><a href="#ai">AI Bible Companion</a></li>
              <li><a href="#features">Reading Plans</a></li>
              <li><a href="#features">Prayer Journal</a></li>
              <li><a href="#features">Community Groups</a></li>
            </ul>
          </div>

          <div className={styles.footerCol}>
            <p className={styles.footerColTitle}>ACCOUNT</p>
            <ul>
              <li><Link href="/auth/register">Create Account</Link></li>
              <li><Link href="/auth/login">Sign In</Link></li>
              <li><Link href="/dashboard">Dashboard</Link></li>
            </ul>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p className={styles.footerCopy}>© {new Date().getFullYear()} MITEV LLC · Uses the King James Version (KJV) — public domain</p>
          <p className={styles.footerCopy}>biblegpt.net</p>
        </div>
      </footer>
    </main>
  );
}
