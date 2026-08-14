/**
 * 150 distinct spoken requests. Run: npx tsx scripts/voice-practice.ts
 */
import { parseVoiceFallback, type VoiceIntentKind } from "../app/Summer27/voice-intent";
import { resolveVoice } from "../app/Summer27/voice-resolve";

type Case = {
  q: string;
  intent: VoiceIntentKind | VoiceIntentKind[];
  href?: string;
  hour?: number;
  clinic?: string;
  pro?: string;
  child?: string;
};

const NOW = new Date(2026, 7, 14, 10, 0, 0); // Fri Aug 14 2026

const CASES: Case[] = [
  // Courts
  { q: "is court 3 open at 11", intent: "check_court", hour: 11, href: "/Summer27/book" },
  { q: "any courts tomorrow at 7am", intent: "check_court", hour: 7 },
  { q: "book court 4 at 4pm", intent: "book_court", hour: 16, href: "court=court-2" },
  { q: "reserve court 3 today at 2", intent: "book_court", hour: 14, href: "court=court-1" },
  { q: "what’s open this afternoon", intent: "check_court" },
  { q: "can I get a court tonight at 6", intent: "check_court", hour: 18 },
  { q: "court 3 at 8am tomorrow", intent: ["check_court", "book_court"], hour: 8 },
  { q: "is there court time Sunday morning", intent: "check_court" },
  { q: "book me 5pm on court 4", intent: "book_court", hour: 17 },
  { q: "any open slots at noon", intent: "check_court", hour: 12 },
  { q: "I need a court at 3 o'clock", intent: ["check_court", "book_court"], hour: 15 },
  { q: "show me the court grid", intent: "check_court", href: "/Summer27/book" },
  { q: "is 7pm free on court 3", intent: "check_court", hour: 19 },
  { q: "book two hours at 10 on court 4", intent: "book_court", hour: 10 },
  { q: "anything open Friday evening", intent: "check_court" },

  // Saturday / Sunday clinics
  { q: "sign up for 9am Sat clinic", intent: "book_clinic", hour: 9, clinic: "sat-sun-point-play" },
  { q: "join the 8am Saturday cardio", intent: "book_clinic", hour: 8, clinic: "sat-sun-cardio" },
  { q: "is there space in Sunday 9am clinic", intent: "check_clinic", hour: 9, clinic: "sat-sun-point-play" },
  { q: "book Saturday point play", intent: "book_clinic", clinic: "sat-sun-point-play" },
  { q: "sign me up for weekend cardio", intent: "book_clinic", clinic: "sat-sun-cardio" },
  { q: "how many spots in the 9am Saturday clinic", intent: "check_clinic", hour: 9, clinic: "sat-sun-point-play" },
  { q: "I want the 8 o'clock Saturday clinic", intent: ["book_clinic", "check_clinic"], hour: 8, clinic: "sat-sun-cardio" },
  { q: "join Sunday morning cardio", intent: "book_clinic", clinic: "sat-sun-cardio" },
  { q: "put me in Saturday 9", intent: "book_clinic", hour: 9, clinic: "sat-sun-point-play" },
  { q: "can I enroll in 9 a.m. Sunday class", intent: "book_clinic", hour: 9, clinic: "sat-sun-point-play" },

  // Weekday clinics
  { q: "sign up for Tennis 101 Tuesday", intent: "book_clinic", clinic: "tue-am-beginner-fundamentals" },
  { q: "is Tennis 101 full", intent: "check_clinic", clinic: "tue-am-beginner-fundamentals" },
  { q: "Thursday ladies doubles clinic", intent: "check_clinic", clinic: "thu-am-ladies-doubles" },
  { q: "join ladies clinic Thursday at 9", intent: "book_clinic", hour: 9, clinic: "thu-am-ladies-doubles" },
  { q: "Men's Cardio Wednesday", intent: "check_clinic", clinic: "wed-am-beginner" },
  { q: "book Wednesday 8am clinic", intent: "book_clinic", hour: 8, clinic: "wed-am-beginner" },
  { q: "weeknight 2.5 clinic Monday", intent: "check_clinic", clinic: "mon-fri-beginner" },
  { q: "sign up for Monday 5pm clinic", intent: "book_clinic", hour: 17, clinic: "mon-fri-beginner" },
  { q: "Friday 6pm clinic spots", intent: "check_clinic", hour: 18, clinic: "mon-fri-int-adv" },
  { q: "join the 3.5 plus weeknight clinic", intent: "book_clinic", clinic: "mon-fri-int-adv" },
  { q: "high performance point play Tuesday", intent: "check_clinic", clinic: "mon-fri-advanced" },
  { q: "book Tuesday 10am clinic", intent: "book_clinic", hour: 10, clinic: "mon-fri-advanced" },
  { q: "any clinic tonight", intent: "check_clinic" },
  { q: "what's the Tuesday 9am clinic", intent: "check_clinic", hour: 9, clinic: "tue-am-beginner-fundamentals" },

  // Juniors
  { q: "put Emma in Tuesday juniors", intent: "book_clinic", child: "Emma", clinic: "tue-am-juniors" },
  { q: "enroll Lucas in high school juniors", intent: "book_clinic", child: "Lucas", clinic: "thu-hs-juniors" },
  { q: "sign up Ava for tots", intent: "book_clinic", child: "Ava", clinic: "wed-am-tots" },
  { q: "Tuesday toddlers for Noah", intent: "book_clinic", child: "Noah", clinic: "wed-am-toddlers" },
  { q: "is there room in Tuesday juniors", intent: "check_clinic", clinic: "tue-am-juniors" },
  { q: "put Mia in Thursday high school clinic", intent: "book_clinic", child: "Mia", clinic: "thu-hs-juniors" },
  { q: "enroll Ben in 4pm tots", intent: "book_clinic", child: "Ben", hour: 16, clinic: "wed-am-tots" },
  { q: "junior clinic Tuesday evening", intent: "check_clinic", clinic: "tue-am-juniors" },
  { q: "sign up both kids for juniors", intent: "book_clinic", clinic: "tue-am-juniors" },
  { q: "can Sophie join toddlers Tuesday", intent: "book_clinic", child: "Sophie", clinic: "wed-am-toddlers" },

  // Lessons
  { q: "I want a lesson", intent: ["check_lesson", "request_lesson"], href: "/Summer27/lessons" },
  { q: "book a lesson with Maya", intent: "request_lesson", pro: "maya-ellison" },
  { q: "lesson with Jonah Saturday at 10", intent: "request_lesson", pro: "jonah-berkowitz", hour: 10 },
  { q: "request Derek tomorrow at 9", intent: "request_lesson", pro: "derek", hour: 9 },
  { q: "private lesson Tuesday morning", intent: ["check_lesson", "request_lesson"] },
  { q: "can I get Maya Thursday at 11", intent: ["check_lesson", "request_lesson"], pro: "maya-ellison", hour: 11 },
  { q: "Jonah after school Tuesday", intent: ["check_lesson", "request_lesson"], pro: "jonah-berkowitz" },
  { q: "how much is a lesson with Derek", intent: "prices", href: "/Summer27/lessons" },
  { q: "book Jonah this Saturday", intent: "request_lesson", pro: "jonah-berkowitz" },
  { q: "I need a lesson Saturday morning", intent: ["check_lesson", "request_lesson"] },
  { q: "Maya Ellison availability", intent: ["check_lesson", "request_lesson"], pro: "maya-ellison" },
  { q: "schedule a hitting lesson with Jonah", intent: "request_lesson", pro: "jonah-berkowitz" },
  { q: "does Maya teach Mondays", intent: ["check_lesson", "request_lesson"], pro: "maya-ellison" },
  { q: "lesson at 4pm with Maya", intent: ["check_lesson", "request_lesson"], pro: "maya-ellison", hour: 16 },
  { q: "who can I book for a junior lesson", intent: ["check_lesson", "request_lesson"] },

  // Cancel / move
  { q: "cancel my court tomorrow", intent: "cancel" },
  { q: "cancel my Saturday 9am clinic", intent: "cancel", hour: 9 },
  { q: "drop me from Tuesday juniors", intent: "cancel" },
  { q: "remove me from court 3 at 4", intent: "cancel", hour: 16 },
  { q: "move my court at 4 to 5", intent: "move", hour: 16 },
  { q: "reschedule my lesson to 11", intent: "move" },
  { q: "cancel Emma’s clinic", intent: "cancel", child: "Emma" },
  { q: "I need to cancel today", intent: "cancel" },
  { q: "change my court to 6pm", intent: "move" },
  { q: "take me off the roster Saturday", intent: "cancel" },

  // My day
  { q: "what do I have today", intent: "my_day" },
  { q: "what’s on my book this weekend", intent: "my_day" },
  { q: "am I booked tomorrow", intent: "my_day" },
  { q: "my schedule Friday", intent: "my_day" },
  { q: "what do I have this week", intent: "my_day" },
  { q: "show my bookings", intent: "my_day" },
  { q: "do I have anything Sunday", intent: "my_day" },
  { q: "my day", intent: "my_day" },

  // Stringing
  { q: "is my racket ready", intent: "check_stringing" },
  { q: "poly at 52", intent: "order_stringing", href: "string=poly" },
  { q: "string my racket with gut", intent: "order_stringing", href: "gut" },
  { q: "order a restring hybrid 55", intent: "order_stringing" },
  { q: "I need a restring", intent: ["order_stringing", "check_stringing"] },
  { q: "synthetic gut 50 pounds", intent: "order_stringing" },
  { q: "drop off a racket for poly", intent: "order_stringing", href: "poly" },
  { q: "check my stringing order", intent: "check_stringing" },
  { q: "multifilament at 58", intent: "order_stringing" },
  { q: "own string 54", intent: "order_stringing" },

  // Events
  { q: "spots in the 105 tournament", intent: "check_event", href: "mixed-rr-august" },
  { q: "sign up for Wimbledon party", intent: "book_event", href: "wimbledon" },
  { q: "family play afternoon", intent: "check_event", href: "family-play" },
  { q: "club championship weekend", intent: "check_event", href: "club-championship" },
  { q: "season close social", intent: "check_event", href: "season-close" },
  { q: "join the mixed doubles round robin", intent: "book_event" },
  { q: "is the 105 full", intent: "check_event", href: "mixed-rr-august" },
  { q: "book the Wimbledon finals event", intent: "book_event", href: "wimbledon" },
  { q: "any club events this month", intent: "check_event" },
  { q: "sign me up for family play", intent: "book_event", href: "family-play" },

  // Play / LFG
  { q: "anyone looking Saturday 11", intent: "check_play", hour: 11 },
  { q: "looking for a game tomorrow", intent: "check_play" },
  { q: "find a hitting partner", intent: "check_play" },
  { q: "anyone free tonight for doubles", intent: "check_play" },
  { q: "LFG Sunday morning", intent: "check_play" },

  // Prices
  { q: "how much is a guest court", intent: "prices" },
  { q: "what do clinics cost", intent: "prices" },
  { q: "stringing prices", intent: "prices" },
  { q: "how much are events", intent: "prices" },
  { q: "guest clinic rate", intent: "prices" },
  { q: "what’s a court for members", intent: ["prices", "check_court"] },

  // Natural / mixed
  { q: "hey can you get me into Saturday 9am", intent: "book_clinic", hour: 9, clinic: "sat-sun-point-play" },
  { q: "I'd like to join cardio this weekend", intent: "book_clinic", clinic: "sat-sun-cardio" },
  { q: "please book Maya for Thursday 10", intent: "request_lesson", pro: "maya-ellison", hour: 10 },
  { q: "um is the ladies clinic open Thursday", intent: "check_clinic", clinic: "thu-am-ladies-doubles" },
  { q: "gotta cancel my 3pm court", intent: "cancel", hour: 15 },
  { q: "can you see if Jonah has Saturday 11", intent: ["check_lesson", "request_lesson"], pro: "jonah-berkowitz", hour: 11 },
  { q: "need court 3 tomorrow morning", intent: ["check_court", "book_court"] },
  { q: "put Oliver in juniors Tuesday", intent: "book_clinic", child: "Oliver", clinic: "tue-am-juniors" },
  { q: "what's left in Tennis 101", intent: "check_clinic", clinic: "tue-am-beginner-fundamentals" },
  { q: "register for Sunday point play", intent: "book_clinic", clinic: "sat-sun-point-play" },
  { q: "I want to hit at 8am Saturday clinic", intent: ["book_clinic", "check_clinic"], hour: 8, clinic: "sat-sun-cardio" },
  { q: "book the advanced clinic Friday night", intent: "book_clinic", clinic: "mon-fri-int-adv" },
  { q: "is high performance full on Tuesday", intent: "check_clinic", clinic: "mon-fri-advanced" },
  { q: "sign up for 5:00 weeknight clinic", intent: "book_clinic", hour: 17, clinic: "mon-fri-beginner" },
  { q: "any 6:30 clinic Friday", intent: "check_clinic", hour: 18.5, clinic: "mon-fri-int-adv" },
  { q: "enroll Grace in high school Thursday", intent: "book_clinic", child: "Grace", clinic: "thu-hs-juniors" },
  { q: "tots at 4 on Tuesday", intent: ["book_clinic", "check_clinic"], hour: 16, clinic: "wed-am-tots" },
  { q: "4:30 toddlers Tuesday", intent: ["book_clinic", "check_clinic"], clinic: "wed-am-toddlers" },
  { q: "Men's cardio this Wednesday 8", intent: ["book_clinic", "check_clinic"], hour: 8, clinic: "wed-am-beginner" },
  { q: "can guests join Saturday cardio", intent: ["book_clinic", "check_clinic"], clinic: "sat-sun-cardio" },
  { q: "I need poly 53 on my Wilson", intent: "order_stringing" },
  { q: "natural gut please", intent: "order_stringing" },
  { q: "hybrid poly and multi 56", intent: "order_stringing" },
  { q: "when is my racket done", intent: "check_stringing" },
  { q: "sign up for club championships", intent: "book_event", href: "club-championship" },
  { q: "opening mixed doubles spots", intent: "check_event" },
  { q: "anyone playing Sunday at 10", intent: "check_play", hour: 10 },
  { q: "hit with someone tomorrow at 9", intent: "check_play", hour: 9 },
  { q: "how much for Jonah", intent: "prices" },
  { q: "cost of a restring", intent: "prices" },
  { q: "move Saturday court from 9 to 11", intent: "move" },
  { q: "cancel the lesson I requested", intent: "cancel" },
  { q: "am I on the 8am cardio roster", intent: ["my_day", "check_clinic"] },
  { q: "book court 4 Sunday 1pm", intent: "book_court", hour: 13 },
  { q: "open courts at 8 tonight", intent: "check_court", hour: 20 },
  { q: "join 9 AM this Saturday please", intent: "book_clinic", hour: 9, clinic: "sat-sun-point-play" },
  { q: "could you enroll Harper in tots", intent: "book_clinic", child: "Harper", clinic: "wed-am-tots" },
  { q: "request a time with Derek Friday", intent: "request_lesson", pro: "derek" },
  { q: "Maya tomorrow at 4:00 pm", intent: ["check_lesson", "request_lesson"], pro: "maya-ellison", hour: 16 },
  { q: "is there a clinic Monday at 5", intent: "check_clinic", hour: 17, clinic: "mon-fri-beginner" },
  { q: "Friday night 3.5 clinic", intent: "check_clinic", clinic: "mon-fri-int-adv" },
  { q: "I wanna book Tennis 101", intent: "book_clinic", clinic: "tue-am-beginner-fundamentals" },
  { q: "ladies doubles this Thursday", intent: "check_clinic", clinic: "thu-am-ladies-doubles" },
  { q: "put me in Wednesday cardio", intent: "book_clinic", clinic: "wed-am-beginner" },
  { q: "Sunday 8am beginner clinic", intent: ["book_clinic", "check_clinic"], hour: 8, clinic: "sat-sun-cardio" },
  { q: "advanced games Saturday 9:00", intent: ["book_clinic", "check_clinic"], hour: 9, clinic: "sat-sun-point-play" },
  { q: "how many open in Tuesday 10 high performance", intent: "check_clinic", hour: 10, clinic: "mon-fri-advanced" },
  { q: "join both Saturday clinics", intent: "book_clinic" },
  { q: "put Emma and Liam in juniors", intent: "book_clinic", child: "Emma", clinic: "tue-am-juniors" },
  { q: "can I still make 9am Saturday", intent: ["book_clinic", "check_clinic"], hour: 9, clinic: "sat-sun-point-play" },
  { q: "looking for doubles Saturday", intent: "check_play" },
  { q: "reschedule 2pm to 4pm", intent: "move", hour: 14 },
  { q: "season end party tickets", intent: ["check_event", "book_event"], href: "season-close" },
];

function asList(v: VoiceIntentKind | VoiceIntentKind[]) {
  return Array.isArray(v) ? v : [v];
}

function main() {
  const seen = new Set<string>();
  const fails: string[] = [];
  if (CASES.length < 150) {
    fails.push(`expected at least 150 cases, got ${CASES.length}`);
  }
  CASES.forEach((c, i) => {
    const key = c.q.toLowerCase();
    if (seen.has(key)) fails.push(`#${i + 1} duplicate: ${c.q}`);
    seen.add(key);
    const intent = parseVoiceFallback(c.q, NOW);
    const result = resolveVoice(intent, null);
    const n = i + 1;
    if (!asList(c.intent).includes(intent.intent)) {
      fails.push(`#${n} intent ${intent.intent} ≠ ${asList(c.intent).join("|")}  “${c.q}”`);
    }
    if (c.hour != null && intent.hour !== c.hour) {
      fails.push(`#${n} hour ${intent.hour} ≠ ${c.hour}  “${c.q}”`);
    }
    if (c.child && intent.childName !== c.child) {
      fails.push(`#${n} child ${intent.childName} ≠ ${c.child}  “${c.q}”`);
    }
    const hrefs = result.links.map((l) => l.href).join(" ");
    if (!result.links.length) fails.push(`#${n} no links  “${c.q}”`);
    if (c.href && !hrefs.includes(c.href) && !result.detail.toLowerCase().includes(c.href.toLowerCase())) {
      fails.push(`#${n} missing href ${c.href}  got ${hrefs}  “${c.q}”`);
    }
    if (c.clinic && !hrefs.includes(c.clinic)) {
      fails.push(`#${n} clinic ${c.clinic}  got ${hrefs}  “${c.q}”`);
    }
    if (c.pro && !hrefs.includes(c.pro)) {
      fails.push(`#${n} pro ${c.pro}  got ${hrefs}  “${c.q}”`);
    }
    if (intent.intent === "unknown") {
      fails.push(`#${n} unknown  “${c.q}”`);
    }
    if (/couldn.?t match|no matching/i.test(result.detail) && c.clinic) {
      fails.push(`#${n} unmatched clinic  “${c.q}”  ${result.detail}`);
    }
  });
  if (fails.length) {
    console.error(`${fails.length} failures / ${CASES.length} phrases\n`);
    console.error(fails.join("\n"));
    process.exit(1);
  }
  console.log(`OK ${CASES.length} distinct practice requests`);
}

main();
