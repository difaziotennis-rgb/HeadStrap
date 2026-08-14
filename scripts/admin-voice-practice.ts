/**
 * 250 distinct director Speak phrases. Run: npx tsx scripts/admin-voice-practice.ts
 */
import { parseAdminVoice, type AdminDraft, type AdminVoiceData } from "../app/Summer27/admin-voice";
import { defaultCatalog } from "../app/Summer27/schedule";
import type { S27AdminBlock } from "../app/Summer27/schedule";
import type {
  S27Charge,
  S27ClinicBooking,
  S27CourtBooking,
  S27EventBooking,
  S27LessonBooking,
  S27MemberAccount,
  S27StringingOrder,
} from "../app/Summer27/storage";

const NOW = new Date(2026, 7, 14, 10, 0, 0); // Fri Aug 14 2026
const TODAY = "2026-08-14";

type Expect = {
  q: string;
  kind: AdminDraft["kind"] | AdminDraft["kind"][];
};

function member(
  number: string,
  name: string,
  children?: { id: string; name: string }[]
): S27MemberAccount {
  return {
    memberNumber: number,
    name,
    email: `${name.split(" ")[0].toLowerCase()}@example.com`,
    phone: "845-555-0100",
    password: "tennis",
    createdAt: "2026-05-01T12:00:00.000Z",
    children,
  };
}

const MEMBERS: S27MemberAccount[] = [
  member("101", "Claire Bennett", [{ id: "c1", name: "Emma Bennett" }]),
  member("102", "Owen Hart", [{ id: "c2", name: "Leo Hart" }]),
  member("103", "Priya Shah"),
  member("104", "Miles Ortega"),
  member("105", "Helen Cho"),
  member("106", "James Whitaker"),
  member("107", "Sarah Lang"),
  member("108", "Tom Brennan"),
  member("109", "Nina Patel"),
  member("110", "Anna Cole"),
  member("111", "David Russo"),
  member("112", "Lucy Hale"),
  member("113", "Ben Calder"),
  member("114", "Marisol Vega"),
];

function fixture(): AdminVoiceData {
  const courts: S27CourtBooking[] = [
    {
      id: "ct-sarah",
      date: TODAY,
      hour: 16,
      durationHours: 1,
      courtId: "court-1",
      courtName: "Court 3",
      clientName: "Sarah Lang",
      clientEmail: "sarah@example.com",
      clientPhone: "845",
      memberNumber: "107",
      amount: 50,
      paymentStatus: "paid",
      paymentMethod: "manual",
      createdAt: "",
    },
    {
      id: "ct-owen-unpaid",
      date: TODAY,
      hour: 11,
      durationHours: 1,
      courtId: "court-2",
      courtName: "Court 4",
      clientName: "Owen Hart",
      clientEmail: "owen@example.com",
      clientPhone: "845",
      memberNumber: "102",
      amount: 50,
      paymentStatus: "pending",
      paymentMethod: "manual",
      createdAt: "",
    },
    {
      id: "ct-claire",
      date: "2026-08-15",
      hour: 9,
      durationHours: 1,
      courtId: "court-1",
      courtName: "Court 3",
      clientName: "Claire Bennett",
      clientEmail: "claire@example.com",
      clientPhone: "845",
      memberNumber: "101",
      amount: 50,
      paymentStatus: "paid",
      paymentMethod: "manual",
      createdAt: "",
    },
  ];
  const clinics: S27ClinicBooking[] = [
    {
      id: "cl-emma",
      clinicId: "tue-am-juniors",
      clinicName: "Tuesday Juniors",
      date: "2026-08-18",
      clientName: "Emma Bennett",
      clientEmail: "claire@example.com",
      memberNumber: "101",
      amount: 55,
      paymentStatus: "paid",
      paymentMethod: "manual",
      createdAt: "",
    },
    {
      id: "cl-nina-unpaid",
      clinicId: "thu-am-ladies-doubles",
      clinicName: "Thursday Ladies Doubles Strategy",
      date: "2026-08-20",
      clientName: "Nina Patel",
      clientEmail: "nina@example.com",
      memberNumber: "109",
      amount: 55,
      paymentStatus: "pending",
      paymentMethod: "manual",
      createdAt: "",
    },
  ];
  const lessons: S27LessonBooking[] = [
    {
      id: "ls-miles",
      date: TODAY,
      hour: 10,
      duration: "60",
      clientName: "Miles Ortega",
      clientEmail: "miles@example.com",
      clientPhone: "845",
      memberNumber: "104",
      proName: "Derek DiFazio",
      focus: "Serve",
      amount: 180,
      paymentStatus: "pending",
      paymentMethod: "manual",
      requestStatus: "requested",
      createdAt: "",
    },
    {
      id: "ls-helen",
      date: "2026-08-15",
      hour: 11,
      duration: "60",
      clientName: "Helen Cho",
      clientEmail: "helen@example.com",
      clientPhone: "845",
      memberNumber: "105",
      proName: "Maya Ellison",
      focus: "Doubles",
      amount: 160,
      paymentStatus: "paid",
      paymentMethod: "manual",
      requestStatus: "requested",
      createdAt: "",
    },
  ];
  const events: S27EventBooking[] = [
    {
      id: "ev-james",
      eventId: "wimbledon-finals-party",
      eventTitle: "Wimbledon Finals Doubles Tournament & Viewing Party",
      eventDate: "2027-07-11",
      attendeeName: "James Whitaker",
      attendeeEmail: "james@example.com",
      guestCount: 1,
      memberNumber: "106",
      amount: 55,
      paymentStatus: "paid",
      paymentMethod: "manual",
      createdAt: "",
    },
  ];
  const stringing: S27StringingOrder[] = [
    {
      id: "st-claire",
      racket: "Wilson",
      stringId: "poly",
      stringName: "Polyester",
      tension: "52",
      clientName: "Claire Bennett",
      clientEmail: "claire@example.com",
      memberNumber: "101",
      amount: 50,
      paymentStatus: "paid",
      paymentMethod: "manual",
      createdAt: "",
      shopStatus: "in_shop",
    },
    {
      id: "st-tom",
      racket: "Babolat",
      stringId: "gut",
      stringName: "Natural gut",
      tension: "55",
      clientName: "Tom Brennan",
      clientEmail: "tom@example.com",
      memberNumber: "108",
      amount: 115,
      paymentStatus: "paid",
      paymentMethod: "manual",
      createdAt: "",
      shopStatus: "ready",
    },
    {
      id: "st-anna-unpaid",
      racket: "Head",
      stringId: "multi",
      stringName: "Multifilament",
      tension: "54",
      clientName: "Anna Cole",
      clientEmail: "anna@example.com",
      memberNumber: "110",
      amount: 78,
      paymentStatus: "pending",
      paymentMethod: "manual",
      createdAt: "",
      shopStatus: "in_shop",
    },
  ];
  const charges: S27Charge[] = [];
  const blocks: S27AdminBlock[] = [
    {
      id: "hold-1",
      date: TODAY,
      courtId: "court-1",
      startHour: 14,
      durationHours: 1,
      reason: "Director hold",
      createdAt: "",
      kind: "hold",
    },
  ];
  return {
    members: MEMBERS,
    courts,
    clinics,
    lessons,
    events,
    stringing,
    charges,
    blocks,
    notes: [],
    catalog: defaultCatalog(),
    today: TODAY,
  };
}

function cases(): Expect[] {
  const out: Expect[] = [];
  const add = (q: string, kind: Expect["kind"]) => out.push({ q, kind });

  add("rain out today", "rain");
  add("rain out tomorrow", "rain");
  add("wash out Saturday", "rain");
  add("close the courts for weather", "rain");
  add("weather close Sunday", "rain");
  add("courts closed for rain today", "rain");
  add("rainout Monday", "rain");
  add("washout tomorrow morning", "rain");
  add("close courts weather Friday", "rain");
  add("weather hold today", "rain");

  add("who's on court 3 at 4", "lookup");
  add("who is on court 4 at 11", "lookup");
  add("what's happening at 4", "lookup");
  add("whats on at 2pm", "lookup");
  add("who's on court 3 at 9am", "lookup");
  add("today's 9am clinic", "lookup");
  add("todays 5pm clinic", "lookup");
  add("hows the Tuesday juniors looking", "lookup");
  add("roster for Thursday ladies", "lookup");
  add("who is in the 9am clinic", "lookup");
  add("what's on court 4 at noon", "lookup");
  add("who is on at 4pm", "lookup");
  add("show the 8am Saturday clinic", "lookup");
  add("who's booked at 3", "lookup");
  add("what is on the book at 6pm", "lookup");
  add("court 3 at 4 who's on it", "lookup");
  add("how's Saturday 9 looking", "lookup");
  add("clinic roster Tuesday juniors", "lookup");
  add("who is on court 3 now", "lookup");
  add("what's happening at 10am", "lookup");
  add("who is in Tennis 101", "lookup");
  add("Sunday 8am clinic roster", "lookup");
  add("who's on court 4 at 7am", "lookup");
  add("what's on at 5", "lookup");
  add("who is on court 3 at 8 tonight", "lookup");
  add("Friday 6pm clinic who is in", "lookup");
  add("board at 11", "lookup");
  add("on court 3 at 1pm", "lookup");
  add("who has court 4 at 2", "lookup");
  add("today at 4 what's on", "lookup");
  add("how's the 8am cardio looking", "lookup");
  add("point play Saturday roster", "lookup");
  add("who's in tots Tuesday", "lookup");
  add("high school juniors roster", "lookup");
  add("who's on court 3 at noon", "lookup");
  add("what is happening at 7pm", "lookup");
  add("Monday 5pm clinic roster", "lookup");
  add("who's booked court 4 today at 4", "lookup");
  add("openings at 3 on court 3", "lookup");
  add("who's teaching at 10", "lookup");

  add("pull up Sarah", "open_member");
  add("open Claire's file", "open_member");
  add("show Owen Hart", "open_member");
  add("member file for Priya", "open_member");
  add("pull up Miles", "open_member");
  add("open Helen Cho", "open_member");
  add("show me James Whitaker", "open_member");
  add("pull up Nina", "open_member");
  add("open Anna Cole", "open_member");
  add("show Lucy's member file", "open_member");
  add("pull up Ben Calder", "open_member");
  add("open Marisol", "open_member");
  add("show David Russo file", "open_member");
  add("pull up Tom Brennan", "open_member");
  add("open member file for Sarah Lang", "open_member");

  add("Claire's racket is ready", "string_ready");
  add("notify Claire her racket is ready", "string_ready");
  add("mark Claires racket ready", "string_ready");
  add("Claire racket done notify her", "string_ready");
  add("stringing ready for Claire", "string_ready");
  add("tell Claire the racket is ready", "string_ready");
  add("Claire Bennett restring is ready", "string_ready");
  add("notify Claire stringing ready", "string_ready");
  add("Tom picked up his racket", "string_pickup");
  add("Tom Brennan collected his racket", "string_pickup");
  add("mark Tom picked up", "string_pickup");
  add("Tom got his racket", "string_pickup");
  add("they took Toms racket", "string_pickup");
  add("Tom picked up the restring", "string_pickup");
  add("Claire picked up her racket", "string_pickup");
  add("mark Claire collected", "string_pickup");

  add("charge Sarah $5 for balls", "charge");
  add("charge Claire five dollars for balls", "charge");
  add("sold Owen a can of balls", "charge");
  add("charge Priya $8 grip", "charge");
  add("charge Miles an overgrip", "charge");
  add("charge Helen $3 drink", "charge");
  add("charge James a Gatorade", "charge");
  add("charge Nina $25 demo", "charge");
  add("charge Anna a demo racket", "charge");
  add("charge Lucy $5 balls", "charge");
  add("charge Ben 8 dollars for a grip", "charge");
  add("charge Marisol a drink from the shop", "charge");
  add("Owen grabbed balls charge him", "charge");
  add("Sarah owes $5 for balls", "charge");
  add("charge Tom $3 water", "charge");
  add("charge David $8 overgrip", "charge");
  add("sold Claire a demo", "charge");
  add("charge Miles $5", "charge");
  add("charge Helen balls", "charge");
  add("charge James $12 for two grips", "charge");
  add("charge Nina three dollars drink", "charge");
  add("charge Anna $25 for demo", "charge");
  add("charge Lucy a can of balls", "charge");
  add("charge Ben a drink", "charge");
  add("charge Marisol $8", "charge");
  add("charge Priya balls", "charge");
  add("Owen owes eight dollars grip", "charge");
  add("charge Sarah Lang $5 balls", "charge");
  add("sold Tom Brennan balls", "charge");
  add("charge Claire Bennett a grip", "charge");

  add("add Emma to Tuesday juniors", "add_clinic");
  add("put Emma in juniors Tuesday", "add_clinic");
  add("sign Emma up for Tuesday juniors", "add_clinic");
  add("add Leo to Tuesday juniors", "add_clinic");
  add("put Leo Hart in juniors", "add_clinic");
  add("add Sarah to Thursday ladies", "add_clinic");
  add("put Nina in ladies doubles", "add_clinic");
  add("add Owen to Saturday 9am", "add_clinic");
  add("put Claire in Saturday point play", "add_clinic");
  add("add Miles to Sunday cardio", "add_clinic");
  add("walk up Helen to Tennis 101", "add_clinic");
  add("add James to Wednesday cardio", "add_clinic");
  add("put Tom in Monday 5pm clinic", "add_clinic");
  add("add Anna to Friday 6pm clinic", "add_clinic");
  add("sign Lucy up for Saturday cardio", "add_clinic");
  add("add Ben to high performance Tuesday", "add_clinic");
  add("put Marisol in 9am Saturday", "add_clinic");
  add("add David to Sunday 8am clinic", "add_clinic");
  add("add Priya to ladies clinic Thursday", "add_clinic");
  add("walk-up Owen Saturday 8 cardio", "add_clinic");
  add("put Emma Bennett in tots", "add_clinic");
  add("add Leo to high school juniors", "add_clinic");
  add("sign Emma up for toddlers", "add_clinic");
  add("add Sarah Lang to Tennis 101", "add_clinic");
  add("put Claire in weeknight 2.5 Monday", "add_clinic");
  add("add Miles to 3.5 Friday clinic", "add_clinic");
  add("walk up Nina to Saturday games", "add_clinic");
  add("add Helen to Sunday 9", "add_clinic");
  add("put James in Wednesday 8am clinic", "add_clinic");
  add("add Tom to Tuesday 10 high performance", "add_clinic");

  add("book Sarah court 3 at 4", "add_court");
  add("book Claire court 4 at 11", "add_court");
  add("add Owen to court 3 at 9am", "add_court");
  add("put Priya on court 4 at 2pm", "add_court");
  add("walk up Miles court 3 at 5", "add_court");
  add("book Helen court 4 at 7am", "add_court");
  add("book James court 3 at noon", "add_court");
  add("add Tom court 4 at 6pm", "add_court");
  add("book Nina court 3 at 8 tonight", "add_court");
  add("put Anna on court 4 at 3", "add_court");
  add("book Lucy court 3 tomorrow at 10", "add_court");
  add("add Ben court 4 Saturday at 2", "add_court");
  add("book Marisol court 3 Sunday at 1", "add_court");
  add("walk-up David court 4 at 4pm", "add_court");
  add("book Sarah Lang court 4 at 5", "add_court");
  add("put Claire Bennett on court 3 at 8am", "add_court");
  add("book Owen Hart court 4 at noon", "add_court");
  add("add Miles Ortega court 3 at 6", "add_court");
  add("book Helen Cho court 3 at 7pm", "add_court");
  add("walk up James court 4 tomorrow at 9", "add_court");
  add("book Tom Brennan court 3 at 11", "add_court");
  add("put Nina Patel on court 4 at 1pm", "add_court");
  add("book Anna Cole court 3 at 2", "add_court");
  add("add Lucy Hale court 4 at 8am", "add_court");
  add("book Ben Calder court 3 Saturday at 4", "add_court");
  add("walk up Marisol Vega court 4 at 5pm", "add_court");
  add("book David Russo court 3 at 3pm", "add_court");
  add("put Priya Shah on court 4 at 10am", "add_court");
  add("book Sarah court 3 tomorrow at 4", "add_court");
  add("add Owen court 4 today at 7", "add_court");

  add("cancel Sarahs court", "cancel");
  add("cancel Sarah's 4pm court", "cancel");
  add("cancel Claires court tomorrow", "cancel");
  add("drop Emma from Tuesday juniors", "cancel");
  add("take Emma off the clinic", "cancel");
  add("cancel Emma's juniors", "cancel");
  add("remove Sarah from court 3", "cancel");
  add("cancel Owens unpaid court", "cancel");
  add("drop Nina from ladies clinic", "cancel");
  add("cancel Claires court at 9", "cancel");
  add("take Sarah off court 3 at 4", "cancel");
  add("cancel Emma Bennett clinic", "cancel");
  add("remove Claire from tomorrow court", "cancel");
  add("drop Nina Patel from clinic", "cancel");
  add("cancel Owen Hart court", "cancel");
  add("take Emma off juniors Tuesday", "cancel");
  add("cancel Sarah Lang 4 o'clock", "cancel");
  add("remove Owen from court 4", "cancel");
  add("cancel Claires 9am court", "cancel");
  add("drop Emma from the roster", "cancel");

  add("hold court 3 at 4", "hold");
  add("hold court 4 at 11", "hold");
  add("block court 3 at 9am", "hold");
  add("hold both courts at 2", "hold");
  add("block court 4 at 6pm", "hold");
  add("hold court 3 at noon", "hold");
  add("close off court 4 at 5", "hold");
  add("hold court 3 tomorrow at 10", "hold");
  add("block court 3 at 7am", "hold");
  add("hold court 4 tonight at 7", "hold");
  add("block both courts at 3pm", "hold");
  add("hold court 3 Saturday at 8", "hold");
  add("close off court 3 at 1", "hold");
  add("hold court 4 Sunday at 9", "hold");
  add("block court 3 at 8 tonight", "hold");
  add("hold court 4 at 2pm", "hold");
  add("block court 3 tomorrow at 4", "hold");
  add("hold both courts at 11am", "hold");
  add("close off court 4 at noon", "hold");
  add("hold court 3 Monday at 5", "hold");

  add("release the hold on court 3 at 2", "release_hold");
  add("release hold on court 3", "release_hold");
  add("lift the hold on court 3 at 2pm", "release_hold");
  add("open the hold on court 3", "release_hold");
  add("unhold court 3 at 2", "release_hold");
  add("release that hold at 2", "release_hold");
  add("lift hold court 3 today", "release_hold");
  add("release the block on court 3", "release_hold");
  add("open hold at 2pm court 3", "release_hold");
  add("unhold court 3", "release_hold");

  add("accept Miles lesson", "lesson_status");
  add("accept Miles Ortega's lesson", "lesson_status");
  add("confirm Miles lesson request", "lesson_status");
  add("accept Helens lesson", "lesson_status");
  add("accept Helen Cho lesson", "lesson_status");
  add("decline Miles lesson", "lesson_status");
  add("decline Miles Ortega lesson", "lesson_status");
  add("decline Helens lesson request", "lesson_status");
  add("accept the lesson for Miles", "lesson_status");
  add("decline Helen's lesson", "lesson_status");

  add("mark Owen paid", "mark_paid");
  add("mark Owens court paid", "mark_paid");
  add("set Owen Hart paid", "mark_paid");
  add("mark Nina paid", "mark_paid");
  add("mark Ninas clinic paid", "mark_paid");
  add("mark Miles lesson paid", "mark_paid");
  add("mark Anna stringing paid", "mark_paid");
  add("Owen court is paid", "mark_paid");
  add("mark Nina Patel paid", "mark_paid");
  add("set Miles paid", "mark_paid");

  add("note for Sarah left bag at desk", "note");
  add("remember Claire wants early courts", "note");
  add("note for Owen: guest coming Saturday", "note");
  add("note Priya no-show last week", "note");
  add("remember Miles prefers court 4", "note");
  add("note for Helen: allergy to latex grip", "note");
  add("note James paying cash tomorrow", "note");
  add("remember Nina is 3.5 doubles", "note");
  add("note for Anna racket in the shop", "note");
  add("note Lucy arriving late at 4", "note");
  add("remember Tom billed for balls already", "note");
  add("note for Ben: junior with dad", "note");
  add("note Marisol demo due back Sunday", "note");
  add("remember David morning player", "note");
  add("note for Claire Bennett: Emma in juniors", "note");

  return out;
}

function asList<T>(v: T | T[]) {
  return Array.isArray(v) ? v : [v];
}

function main() {
  const data = fixture();
  const all = cases();
  const seen = new Set<string>();
  const fails: string[] = [];
  if (all.length < 250) fails.push(`expected at least 250 cases, got ${all.length}`);
  all.forEach((c, i) => {
    const key = c.q.toLowerCase();
    if (seen.has(key)) fails.push(`#${i + 1} duplicate: ${c.q}`);
    seen.add(key);
    const draft = parseAdminVoice(c.q, data, NOW);
    const n = i + 1;
    if (!asList(c.kind).includes(draft.kind)) {
      fails.push(`#${n} kind ${draft.kind} ≠ ${asList(c.kind).join("|")}  “${c.q}”  (${draft.title})`);
    }
    if (draft.kind === "unknown" && !asList(c.kind).includes("unknown")) {
      fails.push(`#${n} unknown  “${c.q}”  ${draft.detail}`);
    }
  });
  if (fails.length) {
    console.error(`${fails.length} failures / ${all.length} phrases\n`);
    console.error(fails.join("\n"));
    process.exit(1);
  }
  console.log(`OK ${all.length} distinct admin practice requests`);
}

main();
