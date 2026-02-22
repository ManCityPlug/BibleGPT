/**
 * BibleGPT — Database Seed
 * Run: pnpm db:seed  (from monorepo root)
 *
 * Seeds:
 *  1. ReadingPlans (365, 90, 60, 30 days)
 *  2. Initial Devotionals (first 14 days)
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Reading Plans ─────────────────────────────────────────────────────────────

const READING_PLANS = [
  {
    name: "Through the Bible in a Year",
    description: "Read the entire Bible — Old and New Testament — in 365 days with balanced daily passages.",
    durationDays: 365,
    schedule: generateYearPlan(),
  },
  {
    name: "90-Day Bible",
    description: "A focused, accelerated journey through the entire Bible in just 90 days.",
    durationDays: 90,
    schedule: generate90DayPlan(),
  },
  {
    name: "New Testament in 60 Days",
    description: "Read all 27 books of the New Testament in 60 days. Perfect for new believers.",
    durationDays: 60,
    schedule: generate60DayNTPlan(),
  },
  {
    name: "30-Day Psalms & Proverbs",
    description: "A month in the wisdom literature. Daily doses of praise, prayer, and practical wisdom.",
    durationDays: 30,
    schedule: generate30DayWisdomPlan(),
  },
];

// Simple passage generators — abbreviated for seed (full schedule would be 365 entries)
function generateYearPlan() {
  const OT = ["Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi"];
  const NT = ["Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation"];
  const books = [...OT, ...NT];
  return Array.from({ length: 365 }, (_, i) => ({
    day: i + 1,
    passages: [`${books[i % books.length]} ${(i % 5) + 1}`],
  }));
}

function generate90DayPlan() {
  const books = ["Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel", "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "Revelation"];
  return Array.from({ length: 90 }, (_, i) => ({
    day: i + 1,
    passages: [`${books[i % books.length]} ${(i % 10) + 1}`, `${books[(i + 3) % books.length]} ${(i % 5) + 1}`],
  }));
}

function generate60DayNTPlan() {
  const NT = ["Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation"];
  return Array.from({ length: 60 }, (_, i) => ({
    day: i + 1,
    passages: [`${NT[i % NT.length]} ${(i % 5) + 1}`],
  }));
}

function generate30DayWisdomPlan() {
  return Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    passages: [`Psalms ${i + 1}`, `Proverbs ${i + 1}`],
  }));
}

// ─── Devotionals ──────────────────────────────────────────────────────────────

const BASE_DATE = new Date("2025-01-01");

const DEVOTIONALS = [
  {
    daysOffset: 0,
    title: "A New Beginning",
    verse: "Lamentations 3:22-23",
    verseText: "It is of the LORD's mercies that we are not consumed, because his compassions fail not. They are new every morning: great is thy faithfulness.",
    content: "Every morning is a fresh start, a new canvas painted with God's unfailing mercy. No matter what yesterday held—its failures, its grief, its weariness—today is new. The same God who guided you through every season of life is the God who greets you this morning. His compassions are not recycled; they are made anew just for you. Step into this day knowing you are held by a faithful God whose love never grows old.",
    prayer: "Lord, thank You for the gift of this new day. Renew my spirit as only You can. Help me to see Your faithfulness in every moment.",
  },
  {
    daysOffset: 1,
    title: "The Shepherd's Call",
    verse: "Psalm 23:1",
    verseText: "The LORD is my shepherd; I shall not want.",
    content: "In just six words, the Psalmist captures the whole of what it means to trust God. When the Lord is your shepherd, you lack nothing essential. A shepherd knows his sheep by name, guides them to green pastures, and protects them from every danger. You are not a number to God—you are known, loved, and led. Today, rest in the assurance that you have a shepherd who will never leave you wanting.",
    prayer: "Good Shepherd, lead me today. Still the anxious thoughts in my heart and remind me that in You I have everything I truly need.",
  },
  {
    daysOffset: 2,
    title: "Strength for Today",
    verse: "Isaiah 40:31",
    verseText: "But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.",
    content: "Waiting is not inactivity—it is active trust. When we wait on God, we are not marking time; we are positioning ourselves to receive His strength. Eagles do not flap frantically to rise; they spread their wings and ride the updraft. God's Spirit is that updraft beneath your wings today. Whatever exhaustion you carry, bring it to Him and allow His strength to replace your own.",
    prayer: "Father, I wait on You. Renew my strength today and teach me to soar on Your promises rather than straining in my own effort.",
  },
  {
    daysOffset: 3,
    title: "Peace That Passes Understanding",
    verse: "Philippians 4:7",
    verseText: "And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.",
    content: "The world offers peace as the absence of conflict. God offers something far greater—a peace that stands guard over your heart even in the middle of the storm. It is a peace that cannot be explained by circumstances because it does not come from circumstances. It comes from Christ. Paul wrote these words from a prison cell, and yet the letter overflows with joy. The same peace that sustained Paul is available to you today.",
    prayer: "Lord Jesus, be my peace today. Guard my heart and mind and let me rest in the calm that only You can give.",
  },
  {
    daysOffset: 4,
    title: "You Are Not Alone",
    verse: "Deuteronomy 31:8",
    verseText: "And the LORD, he it is that doth go before thee; he will be with thee, he will not fail thee, neither forsake thee: fear not, neither be dismayed.",
    content: "The God who parted the Red Sea, who shut the mouths of lions, who raised Lazarus from the dead—He goes before you today. He is not waiting at the finish line watching you struggle through. He walks ahead of you, preparing the way, and He walks beside you, sustaining you in every step. There is nowhere you can go that He has not already been. Face today without fear.",
    prayer: "God, remind me that You go before me today. Every meeting, every conversation, every challenge—You are already there.",
  },
  {
    daysOffset: 5,
    title: "Light in the Darkness",
    verse: "John 8:12",
    verseText: "Then spake Jesus again unto them, saying, I am the light of the world: he that followeth me shall not walk in darkness, but shall have the light of life.",
    content: "Darkness has no power against light. Strike a match in the darkest cave and the darkness flees. Jesus is that light—not a flicker but an eternal, inexhaustible radiance. When we follow Him, we walk in that light. Doubt may cloud your view, but it cannot extinguish the light of Christ. Whatever feels dark in your life today, turn toward the Light of the World and let Him illuminate your path.",
    prayer: "Jesus, be my light today. Where I cannot see clearly, guide me. Where fear tries to dim my hope, shine brighter.",
  },
  {
    daysOffset: 6,
    title: "The Invitation to Rest",
    verse: "Matthew 11:28",
    verseText: "Come unto me, all ye that labour and are heavy laden, and I will give you rest.",
    content: "Jesus does not say 'Come to me when you've got it together.' He says 'Come to me, you who are weary.' The invitation is for the heavy-hearted, the burned-out, the overwhelmed. The rest Jesus offers is not a vacation from life—it is a different way of carrying life's weight. It is His yoke beside us, His strength underneath us. If you are weary today, you are exactly the person Jesus is calling.",
    prayer: "Jesus, I am weary. I accept Your invitation to rest. Teach me Your yoke and help me lay down every burden I was never meant to carry.",
  },
  {
    daysOffset: 7,
    title: "Known and Loved",
    verse: "Psalm 139:1-2",
    verseText: "O LORD, thou hast searched me, and known me. Thou knowest my downsitting and mine uprising, thou understandest my thought afar off.",
    content: "God's knowledge of you is not surveillance—it is intimacy. He knows every thought before you think it, every word before you speak it, every dream before you dream it. And knowing all of this, He still loves you completely. There is nothing to hide from Him, and there is nothing He has seen that has made Him love you less. You are fully known and fully loved. Let that truth reshape how you see yourself today.",
    prayer: "Lord, You know me completely. Help me to live in the freedom of being fully known and fully loved by You.",
  },
  {
    daysOffset: 8,
    title: "Walking by Faith",
    verse: "2 Corinthians 5:7",
    verseText: "For we walk by faith, not by sight.",
    content: "Faith is not the absence of doubt—it is choosing to trust God's character even when the evidence feels unclear. Abraham left his homeland without a map. Moses led Israel into the wilderness trusting a promise. Mary said yes to the impossible. Each of them walked by faith. God honors the steps taken in trust, even when we cannot see where they will lead. Take your next step today—not because you can see the whole staircase, but because you know the One who built it.",
    prayer: "Father, give me the courage to walk by faith today. When I cannot see the next step clearly, help me to trust You.",
  },
  {
    daysOffset: 9,
    title: "Bearing One Another's Burdens",
    verse: "Galatians 6:2",
    verseText: "Bear ye one another's burdens, and so fulfil the law of Christ.",
    content: "Christianity was never meant to be a solo journey. We are designed for community—to share joys and sorrows, to strengthen and be strengthened. The law of Christ is the law of love, and love shows up. It carries grocery bags and sits in hospital waiting rooms. It sends the text that says 'I'm thinking of you.' Today, look around. Who in your life needs you to show up? And who might God be sending to show up for you?",
    prayer: "Lord, make me aware of those around me who need support. And give me the humility to receive support when I need it too.",
  },
  {
    daysOffset: 10,
    title: "Gratitude as a Practice",
    verse: "1 Thessalonians 5:18",
    verseText: "In every thing give thanks: for this is the will of God in Christ Jesus concerning you.",
    content: "Gratitude is not a feeling that appears when circumstances are ideal—it is a discipline practiced in all circumstances. Paul did not say 'for everything give thanks' (as though everything is good). He said 'in everything'—meaning we can find something to thank God for even in the hard seasons. A grateful heart is a transformed heart. Today, name three things you are thankful for and watch the weight of worry begin to lift.",
    prayer: "God, I choose gratitude today. Thank You for Your presence, Your provision, and Your promises. Open my eyes to Your gifts.",
  },
  {
    daysOffset: 11,
    title: "Forgiven and Forgiving",
    verse: "Ephesians 4:32",
    verseText: "And be ye kind one to another, tenderhearted, forgiving one another, even as God for Christ's sake hath forgiven you.",
    content: "Unforgiveness is a prison where we keep ourselves as the jailer. God's forgiveness of us through Christ is the model and the motivation for forgiving others. We forgive not because the other person deserves it, but because we have been forgiven of so much more. Forgiveness does not mean what happened was okay—it means we release the debt and refuse to carry the poison of bitterness any longer. Who needs your forgiveness today?",
    prayer: "Heavenly Father, thank You for the freedom of Your forgiveness. Help me to extend that same grace to those who have hurt me.",
  },
  {
    daysOffset: 12,
    title: "The Word as a Lamp",
    verse: "Psalm 119:105",
    verseText: "Thy word is a lamp unto my feet, and a light unto my path.",
    content: "A lamp unto your feet—not a searchlight that illuminates miles ahead, but enough light for the next step. God often guides us that way: one step at a time, enough light for today. The Bible is not a magic answer book, but it is a living word that, read faithfully, shapes our character, renews our minds, and reveals God's heart. Every time you open it, you are positioning yourself to hear from the One who made you.",
    prayer: "Lord, as I read Your Word, speak to me. Make it a light for my decisions today and a lamp for my uncertain path.",
  },
  {
    daysOffset: 13,
    title: "The Gift of Today",
    verse: "Psalm 118:24",
    verseText: "This is the day which the LORD hath made; we will rejoice and be glad in it.",
    content: "This day—with its particular joys and particular challenges—was made by God. Not stumbled into by accident, not forgotten in the cosmic shuffle. He made this day and gave it to you as a gift. Rejoice is an active word; it is something we choose. Even on the hard days, we can choose to look for God's fingerprints, to notice His mercies, to receive this day as a gift rather than endure it as a trial. Today is yours. Use it well.",
    prayer: "Lord, thank You for today. I choose to rejoice in it. Help me to be fully present and to see Your hand in every moment.",
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding database...");

  // Upsert reading plans
  for (const plan of READING_PLANS) {
    await prisma.readingPlan.upsert({
      where: { id: plan.name.toLowerCase().replace(/\s+/g, "-") },
      update: {},
      create: {
        id: plan.name.toLowerCase().replace(/\s+/g, "-"),
        name: plan.name,
        description: plan.description,
        durationDays: plan.durationDays,
        schedule: plan.schedule,
        isActive: true,
      },
    });
    console.log(`✓ Reading plan: ${plan.name}`);
  }

  // Seed devotionals
  for (const d of DEVOTIONALS) {
    const date = new Date(BASE_DATE);
    date.setDate(date.getDate() + d.daysOffset);
    date.setHours(0, 0, 0, 0);

    await prisma.devotional.upsert({
      where: { date },
      update: {},
      create: {
        date,
        title: d.title,
        verse: d.verse,
        verseText: d.verseText,
        content: d.content,
        prayer: d.prayer,
      },
    });
    console.log(`✓ Devotional: ${d.title}`);
  }

  console.log("\n✅ Seeding complete!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
