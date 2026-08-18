"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useS27Session } from "../use-s27-session";
import { canOneClick, getPaymentProfile } from "../payments";
import {
  BOOKING_HOURS,
  COURTS,
  formatDateInput,
  formatHour,
  formatPrettyDate,
  type CourtId,
} from "../summer27-data";
import { courtSlotConflict, getLiveCourtRates } from "../schedule";
import {
  KEYS,
  lfgCapacity,
  loadList,
  loadRecord,
  persistCourts,
  putCourtBooking,
  saveList,
  uniqueCourts,
  type S27CourtBooking,
  type S27CourtPlayer,
  type S27LessonBooking,
  type S27LfgFormat,
  type S27LfgPost,
  type S27MemberAccount,
} from "../storage";
import { DateChips, dateChipFromIso } from "../DateChips";

function addDays(date: Date, n: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export default function Summer27PlayPage() {
  const session = useS27Session();
  const [posts, setPosts] = useState<S27LfgPost[]>([]);
  const [members, setMembers] = useState<S27MemberAccount[]>([]);
  const [bookings, setBookings] = useState<Record<string, S27CourtBooking>>({});
  const [lessons, setLessons] = useState<S27LessonBooking[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [bookingPost, setBookingPost] = useState<S27LfgPost | null>(null);

  const [date, setDate] = useState(() => formatDateInput(new Date()));
  const [hour, setHour] = useState(9);
  const [format, setFormat] = useState<S27LfgFormat>("singles");
  const [levelNote, setLevelNote] = useState("");
  const [courtPref, setCourtPref] = useState<CourtId | "either">("either");
  const [bookCourtId, setBookCourtId] = useState<CourtId>("court-2");
  const [paying, setPaying] = useState(false);

  const savedCard = canOneClick(session);
  const rate = getLiveCourtRates().member;

  const dayChips = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return Array.from({ length: 14 }, (_, i) => dateChipFromIso(formatDateInput(addDays(start, i))));
  }, []);

  function reload() {
    setPosts(loadList<S27LfgPost>(KEYS.lfg));
    setMembers(loadList<S27MemberAccount>(KEYS.members));
    setBookings(loadRecord<S27CourtBooking>(KEYS.courts));
    setLessons(loadList<S27LessonBooking>(KEYS.lessons));
  }

  useEffect(() => {
    reload();
  }, []);

  const openPosts = useMemo(() => {
    const today = formatDateInput(new Date());
    return posts
      .filter((p) => p.status === "open" && p.date >= today)
      .slice()
      .sort((a, b) => `${a.date}${String(a.hour).padStart(2, "0")}`.localeCompare(`${b.date}${String(b.hour).padStart(2, "0")}`));
  }, [posts]);

  const mine = useMemo(() => {
    if (!session) return [];
    return posts
      .filter(
        (p) =>
          p.status !== "cancelled" &&
          (p.hostMemberNumber === session.memberNumber ||
            p.players.some((pl) => pl.memberNumber === session.memberNumber))
      )
      .slice()
      .sort((a, b) => `${b.date}${String(b.hour).padStart(2, "0")}`.localeCompare(`${a.date}${String(a.hour).padStart(2, "0")}`));
  }, [posts, session]);

  function ping(text: string) {
    setMsg(text);
    window.setTimeout(() => setMsg(null), 3200);
  }

  function savePosts(next: S27LfgPost[]) {
    saveList(KEYS.lfg, next);
    setPosts(next);
  }

  function createPost(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    const post: S27LfgPost = {
      id: uid("lfg"),
      date,
      hour,
      format,
      levelNote: levelNote.trim() || undefined,
      courtPref,
      hostMemberNumber: session.memberNumber,
      hostName: session.memberName,
      players: [{ memberNumber: session.memberNumber, name: session.memberName }],
      status: "open",
      createdAt: new Date().toISOString(),
    };
    savePosts([post, ...posts]);
    setComposing(false);
    setLevelNote("");
    ping(`Posted · ${formatPrettyDate(date)} ${formatHour(hour)}`);
  }

  function joinPost(post: S27LfgPost) {
    if (!session) return;
    if (post.players.some((p) => p.memberNumber === session.memberNumber)) {
      ping("You’re already on this game.");
      return;
    }
    if (post.players.length >= lfgCapacity(post.format)) {
      ping("That game is full.");
      return;
    }
    const next = posts.map((p) =>
      p.id === post.id
        ? {
            ...p,
            players: [...p.players, { memberNumber: session.memberNumber, name: session.memberName }],
          }
        : p
    );
    savePosts(next);
    ping(`Joined ${post.hostName}’s game.`);
  }

  function leavePost(post: S27LfgPost) {
    if (!session) return;
    if (post.hostMemberNumber === session.memberNumber) {
      cancelPost(post);
      return;
    }
    const next = posts.map((p) =>
      p.id === post.id
        ? { ...p, players: p.players.filter((pl) => pl.memberNumber !== session.memberNumber) }
        : p
    );
    savePosts(next);
    ping("Left the game.");
  }

  function cancelPost(post: S27LfgPost) {
    if (!session || post.hostMemberNumber !== session.memberNumber) return;
    savePosts(posts.map((p) => (p.id === post.id ? { ...p, status: "cancelled" as const } : p)));
    ping("Post cancelled.");
  }

  function courtOpen(courtId: CourtId, post: S27LfgPost) {
    if (!BOOKING_HOURS.includes(post.hour)) return false;
    return !courtSlotConflict({
      date: post.date,
      courtId,
      hour: post.hour,
      durationHours: 1,
      bookings: uniqueCourts(bookings),
      lessons,
    });
  }

  async function bookFromPost(post: S27LfgPost) {
    if (!session) return;
    if (!savedCard) {
      ping("Add a card on file to book.");
      return;
    }
    if (!courtOpen(bookCourtId, post)) {
      ping("That court isn’t open — try the other one.");
      return;
    }

    const roster = post.players;
    for (const pl of roster) {
      const card = getPaymentProfile(pl.memberNumber);
      if (!card?.last4) {
        ping(`${pl.name} needs a card on file before you can book.`);
        return;
      }
    }

    const share = Math.round((rate / roster.length) * 100) / 100;
    // Fix rounding so shares sum to rate
    const players: S27CourtPlayer[] = roster.map((pl, i) => {
      const account = members.find((m) => m.memberNumber === pl.memberNumber);
      return {
        memberNumber: pl.memberNumber,
        name: pl.name,
        email: account?.email || "",
        amount: i === 0 ? Math.round((rate - share * (roster.length - 1)) * 100) / 100 : share,
      };
    });

    const host = members.find((m) => m.memberNumber === post.hostMemberNumber);
    const id = uid("court");
    const courtName = COURTS.find((c) => c.id === bookCourtId)?.name || bookCourtId;
    const booking: S27CourtBooking = {
      id,
      date: post.date,
      hour: post.hour,
      durationHours: 1,
      courtId: bookCourtId,
      courtName,
      clientName: post.hostName,
      clientEmail: host?.email || session.memberEmail,
      clientPhone: host?.phone || session.memberPhone || "",
      memberNumber: post.hostMemberNumber,
      amount: rate,
      paymentStatus: "paid",
      paymentMethod: "saved-card",
      createdAt: new Date().toISOString(),
      players,
      format: post.format,
      lfgPostId: post.id,
    };

    setPaying(true);
    const nextBookings = putCourtBooking(bookings, booking);
    persistCourts(uniqueCourts(nextBookings));
    setBookings(nextBookings);
    savePosts(
      posts.map((p) =>
        p.id === post.id ? { ...p, status: "booked" as const, courtBookingId: id } : p
      )
    );
    setBookingPost(null);
    setPaying(false);
    ping(`Court booked · ${courtName} · $${share}/player charged.`);
  }

  if (!session) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Play</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">Looking for a game</h2>
        <p className="mt-2 text-[14px] text-[#6b665e]">Sign in to post or join open games.</p>
        <Link href="/Summer27/member" className="mt-4 inline-block rounded-lg bg-[#1a1a1a] px-4 py-2 text-[13px] text-white">
          Sign in / join
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-10 pt-6 sm:px-6 sm:pt-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Play</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Looking for a game</h2>
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[#6b665e]">
            Post a time you’re free. Others join. Book the court when you’re ready — everyone on the roster is charged their share.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setComposing(true)}
          className="rounded-xl bg-[#1a1a1a] px-4 py-2.5 text-[13px] font-medium text-white"
        >
          Post a game
        </button>
      </div>

      {msg && (
        <p className="mt-4 rounded-xl border border-[#e8e5df] bg-[#faf9f7] px-3 py-2 text-[13px] text-[#4a4a4a]">
          {msg}
        </p>
      )}

      <section className="mt-6">
        <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Open games</p>
        {openPosts.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-[#e8e5df] bg-white px-4 py-8 text-center text-[14px] text-[#8a8477]">
            No open posts yet — be the first.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {openPosts.map((post) => {
              const cap = lfgCapacity(post.format);
              const seats = cap - post.players.length;
              const onIt = post.players.some((p) => p.memberNumber === session.memberNumber);
              const isHost = post.hostMemberNumber === session.memberNumber;
              return (
                <li key={post.id} className="rounded-2xl border border-[#e8e5df] bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-[16px] font-semibold tracking-tight">
                        {formatPrettyDate(post.date)} · {formatHour(post.hour)}
                      </p>
                      <p className="mt-0.5 text-[13px] text-[#6b665e]">
                        {post.format === "doubles" ? "Doubles" : "Singles"} · {post.players.length}/{cap}
                        {post.courtPref && post.courtPref !== "either"
                          ? ` · ${COURTS.find((c) => c.id === post.courtPref)?.name}`
                          : " · either court"}
                      </p>
                      {post.levelNote && <p className="mt-1 text-[13px] text-[#4a4a4a]">{post.levelNote}</p>}
                      <p className="mt-2 text-[12px] text-[#8a8477]">
                        {post.players.map((p) => p.name).join(" · ")}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {!onIt && seats > 0 && (
                        <button
                          type="button"
                          onClick={() => joinPost(post)}
                          className="rounded-lg bg-[#1a1a1a] px-3 py-2 text-[12px] font-medium text-white"
                        >
                          Join
                        </button>
                      )}
                      {onIt && !isHost && (
                        <button
                          type="button"
                          onClick={() => leavePost(post)}
                          className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px] text-[#6b665e]"
                        >
                          Leave
                        </button>
                      )}
                      {isHost && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setBookCourtId(
                                post.courtPref && post.courtPref !== "either" ? post.courtPref : "court-2"
                              );
                              setBookingPost(post);
                            }}
                            className="rounded-lg bg-[#1a1a1a] px-3 py-2 text-[12px] font-medium text-white"
                          >
                            Book court
                          </button>
                          <button
                            type="button"
                            onClick={() => cancelPost(post)}
                            className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px] text-[#991b1b]"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {onIt && !isHost && post.players.length >= 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            setBookCourtId(
                              post.courtPref && post.courtPref !== "either" ? post.courtPref : "court-2"
                            );
                            setBookingPost(post);
                          }}
                          className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px] font-medium text-[#1a1a1a]"
                        >
                          Book court
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {mine.length > 0 && (
        <section className="mt-8">
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Your games</p>
          <ul className="mt-3 divide-y divide-[#f0ede8] overflow-hidden rounded-2xl border border-[#e8e5df] bg-white">
            {mine.map((post) => (
              <li key={post.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div>
                  <p className="text-[14px] font-medium">
                    {formatPrettyDate(post.date)} · {formatHour(post.hour)}
                  </p>
                  <p className="text-[12px] text-[#6b665e]">
                    {post.format} · {post.status}
                    {post.hostMemberNumber === session.memberNumber ? " · host" : ""}
                  </p>
                </div>
                {post.status === "booked" && (
                  <Link href="/Summer27/book" className="text-[12px] text-[#6b665e] underline-offset-2 hover:underline">
                    Courts
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {composing && (
        <div className="fixed inset-0 z-40 flex items-end justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center sm:p-4">
          <button type="button" aria-label="Close" className="absolute inset-0 bg-[#1a1a1a]/30" onClick={() => setComposing(false)} />
          <form
            onSubmit={createPost}
            className="relative z-10 w-full max-w-md space-y-3 overflow-hidden rounded-2xl border border-[#e8e5df] bg-white p-4 shadow-xl"
          >
            <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Post a game</p>
            <DateChips items={dayChips} value={date} onChange={setDate} ariaLabel="Game dates" />
            <div className="grid grid-cols-2 gap-2">
              <label className="text-[11px] text-[#8a8477]">
                Time
                <select
                  className="mt-1 w-full rounded-xl border border-[#e8e5df] px-3 py-2.5 text-[14px]"
                  value={hour}
                  onChange={(e) => setHour(Number(e.target.value))}
                >
                  {BOOKING_HOURS.map((h) => (
                    <option key={h} value={h}>
                      {formatHour(h)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-[11px] text-[#8a8477]">
                Format
                <select
                  className="mt-1 w-full rounded-xl border border-[#e8e5df] px-3 py-2.5 text-[14px]"
                  value={format}
                  onChange={(e) => setFormat(e.target.value as S27LfgFormat)}
                >
                  <option value="singles">Singles (2)</option>
                  <option value="doubles">Doubles (4)</option>
                </select>
              </label>
            </div>
            <label className="block text-[11px] text-[#8a8477]">
              Court preference
              <select
                className="mt-1 w-full rounded-xl border border-[#e8e5df] px-3 py-2.5 text-[14px]"
                value={courtPref}
                onChange={(e) => setCourtPref(e.target.value as CourtId | "either")}
              >
                <option value="either">Either court</option>
                {COURTS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-[11px] text-[#8a8477]">
              Note (optional)
              <input
                className="mt-1 w-full rounded-xl border border-[#e8e5df] px-3 py-2.5 text-[14px]"
                value={levelNote}
                onChange={(e) => setLevelNote(e.target.value)}
                placeholder="e.g. 3.5+ · friendly doubles"
              />
            </label>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button type="button" onClick={() => setComposing(false)} className="rounded-2xl border border-[#e8e5df] py-3 text-[14px] font-medium text-[#4a4a4a]">
                Cancel
              </button>
              <button type="submit" className="rounded-2xl bg-[#1a1a1a] py-3 text-[14px] font-medium text-white">
                Post
              </button>
            </div>
          </form>
        </div>
      )}

      {bookingPost && (
        <div className="fixed inset-0 z-40 flex items-end justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center sm:p-4">
          <button type="button" aria-label="Close" className="absolute inset-0 bg-[#1a1a1a]/30" onClick={() => setBookingPost(null)} />
          <div className="relative z-10 w-full max-w-md space-y-3 overflow-hidden rounded-2xl border border-[#e8e5df] bg-white p-4 shadow-xl">
            <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Book from game</p>
            <p className="text-[16px] font-semibold tracking-tight">
              {formatPrettyDate(bookingPost.date)} · {formatHour(bookingPost.hour)}
            </p>
            <p className="text-[13px] text-[#6b665e]">
              {bookingPost.players.length} players · ${Math.round((rate / bookingPost.players.length) * 100) / 100} each
              (card on file)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {COURTS.map((c) => {
                const open = courtOpen(c.id, bookingPost);
                return (
                  <button
                    key={c.id}
                    type="button"
                    disabled={!open}
                    onClick={() => setBookCourtId(c.id)}
                    className={`rounded-xl border px-3 py-3 text-[13px] font-medium disabled:opacity-35 ${
                      bookCourtId === c.id ? "border-[#1a1a1a] bg-[#1a1a1a] text-white" : "border-[#e8e5df] bg-[#faf9f7]"
                    }`}
                  >
                    {c.name}
                    {!open ? " · taken" : ""}
                  </button>
                );
              })}
            </div>
            <p className="text-[12px] text-[#8a8477]">{bookingPost.players.map((p) => p.name).join(" · ")}</p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setBookingPost(null)} className="rounded-2xl border border-[#e8e5df] py-3 text-[14px] font-medium text-[#4a4a4a]">
                Back
              </button>
              <button
                type="button"
                disabled={paying || !courtOpen(bookCourtId, bookingPost)}
                onClick={() => bookFromPost(bookingPost)}
                className="rounded-2xl bg-[#1a1a1a] py-3 text-[14px] font-medium text-white disabled:opacity-40"
              >
                {paying ? "Booking…" : "Confirm & charge"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
