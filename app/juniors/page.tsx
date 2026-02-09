"use client";

import { useState, useMemo } from "react";
import { Sun, Calendar, Clock, MapPin, Users, ChevronDown, CheckCircle, DollarSign, User } from "lucide-react";

// Generate all clinic weeks (Sun-Fri) from June 28 to July 31, 2026
function getClinicWeeks() {
  const weeks: { label: string; startDate: string; days: string[] }[] = [];
  const start = new Date(2026, 5, 28); // June 28, 2026 (Sunday)
  const end = new Date(2026, 6, 31); // July 31, 2026

  let current = new Date(start);
  while (current <= end) {
    // Find the Sunday of this week
    const sun = new Date(current);
    while (sun.getDay() !== 0) sun.setDate(sun.getDate() - 1);

    const wed = new Date(sun);
    wed.setDate(wed.getDate() + 3);
    const fri = new Date(sun);
    fri.setDate(fri.getDate() + 5);

    const fmt = (d: Date) =>
      d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const isoFmt = (d: Date) => d.toISOString().split("T")[0];

    // Only include if at least one day is in range
    const days: string[] = [];
    if (sun >= start && sun <= end) days.push(isoFmt(sun));
    if (wed >= start && wed <= end) days.push(isoFmt(wed));
    if (fri >= start && fri <= end) days.push(isoFmt(fri));

    if (days.length > 0) {
      weeks.push({
        label: `${fmt(sun)} – ${fmt(fri)}`,
        startDate: isoFmt(sun),
        days,
      });
    }

    // Move to next Sunday
    current = new Date(sun);
    current.setDate(current.getDate() + 7);
  }
  return weeks;
}

const WEEKLY_PRICE = 175;
const DROPIN_PRICE = 75;

export default function JuniorsPage() {
  const weeks = useMemo(() => getClinicWeeks(), []);

  const [formData, setFormData] = useState({
    childName: "",
    childAge: "",
    ageGroup: "" as "" | "6-11" | "12-16",
    parentName: "",
    parentEmail: "",
    parentPhone: "",
    experience: "",
    notes: "",
  });
  // Track which individual days are selected, keyed by date string
  const [selectedDays, setSelectedDays] = useState<Record<string, boolean>>({});
  // Track which weeks are expanded in the UI
  const [expandedWeeks, setExpandedWeeks] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const toggleWeekExpanded = (startDate: string, weekDays: string[]) => {
    const isExpanded = expandedWeeks[startDate];
    if (isExpanded) {
      // Collapse: remove all days for this week
      setExpandedWeeks((prev) => ({ ...prev, [startDate]: false }));
      setSelectedDays((prev) => {
        const next = { ...prev };
        weekDays.forEach((d) => delete next[d]);
        return next;
      });
    } else {
      // Expand: select all days for this week by default
      setExpandedWeeks((prev) => ({ ...prev, [startDate]: true }));
      setSelectedDays((prev) => {
        const next = { ...prev };
        weekDays.forEach((d) => (next[d] = true));
        return next;
      });
    }
  };

  const toggleDay = (date: string) => {
    setSelectedDays((prev) => {
      const next = { ...prev };
      if (next[date]) {
        delete next[date];
      } else {
        next[date] = true;
      }
      return next;
    });
  };

  // Calculate pricing: for each week, if all 3 days are selected → weekly rate; otherwise each day is drop-in
  const { totalPrice, weeklyCount, dropinCount, totalDays } = useMemo(() => {
    let weekly = 0;
    let dropin = 0;
    const allSelected = Object.keys(selectedDays).filter((d) => selectedDays[d]);

    for (const week of weeks) {
      const selectedInWeek = week.days.filter((d) => selectedDays[d]);
      if (selectedInWeek.length === week.days.length && week.days.length === 3) {
        weekly++;
      } else {
        dropin += selectedInWeek.length;
      }
    }

    return {
      totalPrice: weekly * WEEKLY_PRICE + dropin * DROPIN_PRICE,
      weeklyCount: weekly,
      dropinCount: dropin,
      totalDays: allSelected.length,
    };
  }, [selectedDays, weeks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalDays === 0 || !formData.ageGroup) return;

    setSending(true);

    const allSelected = Object.keys(selectedDays).filter((d) => selectedDays[d]).sort();

    try {
      const res = await fetch("/api/junior-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          ageGroup: formData.ageGroup,
          ageGroupLabel: formData.ageGroup === "6-11" ? "Ages 6–11 (11:00 AM – 12:00 PM)" : "Ages 12–16 (12:00 – 1:00 PM)",
          selectedDays: allSelected,
          weeklyCount,
          dropinCount,
          totalPrice,
          registrationType: dropinCount > 0 ? "mixed" : "weekly",
          selectedWeeks: weeks
            .filter((w) => w.days.every((d) => selectedDays[d]) && w.days.length === 3)
            .map((w) => w.startDate),
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      }
    } catch (err) {
      console.error("Registration error:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#1a1a1a]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2d5016]/20 via-transparent to-[#1a1a1a]" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#8a8477] mb-4">
            DiFazio Tennis
          </p>
          <h1 className="text-[32px] sm:text-[44px] font-light tracking-tight text-white mb-4 leading-[1.1]">
            Junior Summer Clinic
          </h1>
          <p className="text-[15px] sm:text-[17px] text-white/60 font-light max-w-md mx-auto leading-relaxed">
            A fun, skills-based tennis program for ages 6–16 with two age groups.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-[13px] text-white/50">
            <span className="flex items-center gap-1.5">
              <Sun className="h-4 w-4 text-[#8a8477]" />
              June 28 – July 31
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-[#8a8477]" />
              Sun / Wed / Fri
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-[#8a8477]" />
              11 AM – 1 PM
            </span>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-[12px]">
            <span className="bg-white/10 text-white/70 px-4 py-1.5 rounded-full">
              Ages 6–11 · 11:00 AM – 12:00 PM
            </span>
            <span className="bg-white/10 text-white/70 px-4 py-1.5 rounded-full">
              Ages 12–16 · 12:00 – 1:00 PM
            </span>
          </div>

          <div className="mt-10">
            <a
              href="#register"
              className="inline-block px-8 py-3.5 bg-[#2d5016] text-white rounded-lg text-[14px] font-semibold hover:bg-[#3a6a1e] transition-colors"
            >
              Register Now
            </a>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-[#faf9f7] border-b border-[#e8e5df]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid sm:grid-cols-2 gap-4 max-w-lg mx-auto">
            <div className="bg-white rounded-2xl border border-[#e8e5df] p-6 text-center">
              <p className="text-[10px] tracking-[0.15em] uppercase text-[#7a756d] font-medium mb-2">
                Weekly Rate
              </p>
              <p className="text-[32px] font-light text-[#1a1a1a] tracking-tight">
                ${WEEKLY_PRICE}
              </p>
              <p className="text-[13px] text-[#a39e95] mt-1">
                per week · 3 sessions
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-[#e8e5df] p-6 text-center">
              <p className="text-[10px] tracking-[0.15em] uppercase text-[#7a756d] font-medium mb-2">
                Drop-In
              </p>
              <p className="text-[32px] font-light text-[#1a1a1a] tracking-tight">
                ${DROPIN_PRICE}
              </p>
              <p className="text-[13px] text-[#a39e95] mt-1">
                per session · single day
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Details Grid */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div className="grid sm:grid-cols-2 gap-5">
          {/* Schedule */}
          <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <Calendar className="h-5 w-5 text-[#2d5016]" />
              <h3 className="text-[10px] tracking-[0.15em] uppercase text-[#7a756d] font-medium">
                Schedule
              </h3>
            </div>
            <p className="text-[15px] text-[#1a1a1a] font-medium mb-1">
              Sunday, Wednesday, Friday
            </p>
            <p className="text-[14px] text-[#7a756d]">
              Ages 6–11: 11:00 AM – 12:00 PM
            </p>
            <p className="text-[14px] text-[#7a756d]">
              Ages 12–16: 12:00 – 1:00 PM
            </p>
            <p className="text-[13px] text-[#a39e95] mt-3">
              5 weeks from June 28 through July 31. Register by the week or drop in for a single session.
            </p>
          </div>

          {/* Location */}
          <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <MapPin className="h-5 w-5 text-[#2d5016]" />
              <h3 className="text-[10px] tracking-[0.15em] uppercase text-[#7a756d] font-medium">
                Location
              </h3>
            </div>
            <p className="text-[15px] text-[#1a1a1a] font-medium mb-1">
              Rhinebeck Tennis Club
            </p>
            <p className="text-[14px] text-[#7a756d]">Rhinebeck, NY</p>
            <p className="text-[13px] text-[#a39e95] mt-3">
              Outdoor courts with a beautiful setting in the Hudson Valley.
            </p>
          </div>

          {/* Ages */}
          <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <Users className="h-5 w-5 text-[#2d5016]" />
              <h3 className="text-[10px] tracking-[0.15em] uppercase text-[#7a756d] font-medium">
                Who It's For
              </h3>
            </div>
            <p className="text-[15px] text-[#1a1a1a] font-medium mb-1">
              Two Age Groups
            </p>
            <p className="text-[14px] text-[#7a756d]">Ages 6–11 and Ages 12–16</p>
            <p className="text-[13px] text-[#a39e95] mt-3">
              All skill levels welcome. The younger group runs 11 AM – 12 PM, the middle/high school group runs 12 – 1 PM.
            </p>
          </div>

          {/* Coaches */}
          <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <Users className="h-5 w-5 text-[#2d5016]" />
              <h3 className="text-[10px] tracking-[0.15em] uppercase text-[#7a756d] font-medium">
                Your Coaches
              </h3>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-[15px] text-[#1a1a1a] font-medium mb-0.5">
                  Derek DiFazio
                </p>
                <p className="text-[13px] text-[#a39e95]">
                  15+ years coaching experience. Former Division I player at Clemson University and national doubles champion.
                </p>
              </div>
              <div className="border-t border-[#f0ede8] pt-4">
                <p className="text-[15px] text-[#1a1a1a] font-medium mb-0.5">
                  Jonah Berkowitz
                </p>
                <p className="text-[13px] text-[#a39e95]">
                  Hudson Valley native with years of experience coaching all ages. Went undefeated in match play at FDR High School, played at Brown University.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What to Expect */}
      <section className="bg-white border-y border-[#e8e5df]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <h2 className="text-[10px] tracking-[0.15em] uppercase text-[#7a756d] font-medium mb-6">
            What to Expect
          </h2>
          <div className="space-y-4">
            {[
              {
                title: "Warm-up & Footwork",
                desc: "Dynamic stretching, agility drills, and coordination exercises to get moving.",
              },
              {
                title: "Stroke Development",
                desc: "Forehands, backhands, volleys, and serves — broken down step by step with individual feedback.",
              },
              {
                title: "Point Play & Games",
                desc: "Fun match-play formats, team challenges, and point-based games to build competitive instincts.",
              },
              {
                title: "Cool Down & Recap",
                desc: "Review what we learned, set goals, and cool down together.",
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 items-start">
                <span className="text-[12px] font-medium text-[#2d5016] bg-[#e8f5e1] w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div>
                  <p className="text-[14px] font-medium text-[#1a1a1a]">
                    {item.title}
                  </p>
                  <p className="text-[13px] text-[#7a756d] mt-0.5">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Registration Form */}
      <section id="register" className="max-w-3xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-[#1a1a1a] mb-2 text-center">
            Register
          </h2>
          <p className="text-[13px] text-[#7a756d] text-center mb-8">
            Select full weeks or individual days below.
          </p>

          {submitted ? (
            <div className="bg-white rounded-2xl border border-[#e8e5df] p-8 text-center">
              <CheckCircle className="h-12 w-12 text-[#2d5016] mx-auto mb-4" />
              <h3 className="text-[18px] font-medium text-[#1a1a1a] mb-2">
                You're registered!
              </h3>
              <p className="text-[13px] text-[#7a756d]">
                Thanks for signing up
                {formData.childName ? ` ${formData.childName}` : ""}! We'll
                send a confirmation email to{" "}
                <strong>{formData.parentEmail}</strong> with all the details.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Week Selection */}
              <div className="bg-white rounded-2xl border border-[#e8e5df] p-5">
                <p className="text-[10px] tracking-[0.15em] uppercase text-[#7a756d] font-medium mb-1">
                  Select Weeks & Days
                </p>
                <p className="text-[11px] text-[#a39e95] mb-3">
                  Tap a week to add it. All 3 days = ${WEEKLY_PRICE}/week. Individual days = ${DROPIN_PRICE} each.
                </p>
                <div className="space-y-1.5 max-h-[380px] overflow-y-auto">
                  {weeks.map((week) => {
                    const isExpanded = expandedWeeks[week.startDate];
                    const selectedInWeek = week.days.filter((d) => selectedDays[d]);
                    const isFullWeek = selectedInWeek.length === week.days.length && week.days.length === 3;

                    return (
                      <div key={week.startDate}>
                        <button
                          type="button"
                          onClick={() => toggleWeekExpanded(week.startDate, week.days)}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-[13px] transition-all border ${
                            isExpanded
                              ? "bg-[#e8f5e1] border-[#2d5016]/30 text-[#1a1a1a]"
                              : "bg-[#faf9f7] border-transparent text-[#7a756d] hover:bg-[#f0ede8]"
                          }`}
                        >
                          <span className="font-medium">{week.label}</span>
                          <span className="flex items-center gap-2">
                            {isExpanded && (
                              <span className="text-[11px] text-[#2d5016] font-medium">
                                {isFullWeek ? `$${WEEKLY_PRICE}` : `$${selectedInWeek.length * DROPIN_PRICE}`}
                              </span>
                            )}
                            {isExpanded ? (
                              <CheckCircle className="h-4 w-4 text-[#2d5016]" />
                            ) : (
                              <span className="text-[14px] text-[#c4bfb8]">+</span>
                            )}
                          </span>
                        </button>
                        {isExpanded && (
                          <div className="ml-3 mt-1 mb-2 space-y-1">
                            {week.days.map((day) => {
                              const dt = new Date(day + "T12:00:00");
                              const dayLabel = dt.toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              });
                              const isChecked = selectedDays[day];

                              return (
                                <button
                                  key={day}
                                  type="button"
                                  onClick={() => toggleDay(day)}
                                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-[12px] transition-all ${
                                    isChecked
                                      ? "bg-[#f0fae8] text-[#1a1a1a]"
                                      : "bg-[#faf9f7] text-[#a39e95]"
                                  }`}
                                >
                                  <span className={isChecked ? "font-medium" : ""}>{dayLabel}</span>
                                  <span
                                    className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                                      isChecked
                                        ? "bg-[#2d5016] border-[#2d5016] text-white"
                                        : "border-[#d9d5cf] bg-white"
                                    }`}
                                  >
                                    {isChecked && "✓"}
                                  </span>
                                </button>
                              );
                            })}
                            {selectedInWeek.length > 0 && selectedInWeek.length < 3 && (
                              <p className="text-[10px] text-[#a39e95] px-3 pt-1">
                                Select all 3 days to get the weekly rate (${WEEKLY_PRICE} vs ${selectedInWeek.length * DROPIN_PRICE})
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {totalDays > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#f0ede8] flex items-center justify-between">
                    <span className="text-[12px] text-[#7a756d]">
                      {weeklyCount > 0 && `${weeklyCount} full week${weeklyCount !== 1 ? "s" : ""}`}
                      {weeklyCount > 0 && dropinCount > 0 && " + "}
                      {dropinCount > 0 && `${dropinCount} individual day${dropinCount !== 1 ? "s" : ""}`}
                    </span>
                    <span className="text-[14px] font-medium text-[#1a1a1a]">
                      ${totalPrice}
                    </span>
                  </div>
                )}
              </div>

              {/* Child Info */}
              <div className="bg-white rounded-2xl border border-[#e8e5df] p-5 space-y-3">
                <p className="text-[10px] tracking-[0.15em] uppercase text-[#7a756d] font-medium">
                  Player Info
                </p>
                <div>
                  <label className="block text-[11px] text-[#7a756d] mb-1">
                    Child's Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.childName}
                    onChange={(e) =>
                      setFormData({ ...formData, childName: e.target.value })
                    }
                    className="w-full px-3 py-2.5 bg-[#faf9f7] border border-[#e8e5df] rounded-lg text-[16px] sm:text-[14px] text-[#1a1a1a] placeholder:text-[#c4bfb8] focus:ring-1 focus:ring-[#2d5016] focus:border-[#2d5016] outline-none transition-all"
                    placeholder="First and last name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-[#7a756d] mb-1">
                      Age
                    </label>
                    <input
                      type="number"
                      required
                      min={4}
                      max={18}
                      value={formData.childAge}
                      onChange={(e) =>
                        setFormData({ ...formData, childAge: e.target.value })
                      }
                      className="w-full px-3 py-2.5 bg-[#faf9f7] border border-[#e8e5df] rounded-lg text-[16px] sm:text-[14px] text-[#1a1a1a] placeholder:text-[#c4bfb8] focus:ring-1 focus:ring-[#2d5016] focus:border-[#2d5016] outline-none transition-all"
                      placeholder="Age"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-[#7a756d] mb-1">
                    Age Group
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, ageGroup: "6-11" })}
                      className={`py-2.5 px-3 rounded-lg text-[13px] font-medium transition-all border ${
                        formData.ageGroup === "6-11"
                          ? "bg-[#2d5016] text-white border-[#2d5016]"
                          : "bg-[#faf9f7] text-[#1a1a1a] border-[#e8e5df] hover:border-[#c4bfb8]"
                      }`}
                    >
                      <span className="block">Ages 6–11</span>
                      <span className={`text-[10px] ${formData.ageGroup === "6-11" ? "text-white/60" : "text-[#a39e95]"}`}>11:00 AM – 12:00 PM</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, ageGroup: "12-16" })}
                      className={`py-2.5 px-3 rounded-lg text-[13px] font-medium transition-all border ${
                        formData.ageGroup === "12-16"
                          ? "bg-[#2d5016] text-white border-[#2d5016]"
                          : "bg-[#faf9f7] text-[#1a1a1a] border-[#e8e5df] hover:border-[#c4bfb8]"
                      }`}
                    >
                      <span className="block">Ages 12–16</span>
                      <span className={`text-[10px] ${formData.ageGroup === "12-16" ? "text-white/60" : "text-[#a39e95]"}`}>12:00 – 1:00 PM</span>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-[#7a756d] mb-1">
                    Experience Level
                  </label>
                  <input
                    type="text"
                    value={formData.experience}
                    onChange={(e) =>
                      setFormData({ ...formData, experience: e.target.value })
                    }
                    className="w-full px-3 py-2.5 bg-[#faf9f7] border border-[#e8e5df] rounded-lg text-[16px] sm:text-[14px] text-[#1a1a1a] placeholder:text-[#c4bfb8] focus:ring-1 focus:ring-[#2d5016] focus:border-[#2d5016] outline-none transition-all"
                    placeholder="e.g. beginner, played one season, etc."
                  />
                  <p className="text-[10px] text-[#a39e95] mt-1">
                    A few words about your child's level helps us place them appropriately.
                  </p>
                </div>
              </div>

              {/* Parent Info */}
              <div className="bg-white rounded-2xl border border-[#e8e5df] p-5 space-y-3">
                <p className="text-[10px] tracking-[0.15em] uppercase text-[#7a756d] font-medium">
                  Parent / Guardian
                </p>
                <div>
                  <label className="block text-[11px] text-[#7a756d] mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.parentName}
                    onChange={(e) =>
                      setFormData({ ...formData, parentName: e.target.value })
                    }
                    className="w-full px-3 py-2.5 bg-[#faf9f7] border border-[#e8e5df] rounded-lg text-[16px] sm:text-[14px] text-[#1a1a1a] placeholder:text-[#c4bfb8] focus:ring-1 focus:ring-[#2d5016] focus:border-[#2d5016] outline-none transition-all"
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#7a756d] mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.parentEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, parentEmail: e.target.value })
                    }
                    className="w-full px-3 py-2.5 bg-[#faf9f7] border border-[#e8e5df] rounded-lg text-[16px] sm:text-[14px] text-[#1a1a1a] placeholder:text-[#c4bfb8] focus:ring-1 focus:ring-[#2d5016] focus:border-[#2d5016] outline-none transition-all"
                    placeholder="you@email.com"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#7a756d] mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.parentPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, parentPhone: e.target.value })
                    }
                    className="w-full px-3 py-2.5 bg-[#faf9f7] border border-[#e8e5df] rounded-lg text-[16px] sm:text-[14px] text-[#1a1a1a] placeholder:text-[#c4bfb8] focus:ring-1 focus:ring-[#2d5016] focus:border-[#2d5016] outline-none transition-all"
                    placeholder="(optional)"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="bg-white rounded-2xl border border-[#e8e5df] p-5">
                <label className="block text-[11px] text-[#7a756d] mb-1">
                  Anything else we should know?
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2.5 bg-[#faf9f7] border border-[#e8e5df] rounded-lg text-[16px] sm:text-[14px] text-[#1a1a1a] placeholder:text-[#c4bfb8] focus:ring-1 focus:ring-[#2d5016] focus:border-[#2d5016] outline-none transition-all resize-none"
                  placeholder="Allergies, special needs, or anything helpful to know"
                />
              </div>

              {/* Total & Submit */}
              <div className="bg-[#1a1a1a] rounded-2xl p-5 text-center">
                <p className="text-[11px] tracking-[0.1em] uppercase text-white/50 mb-1">
                  Total
                </p>
                <p className="text-[28px] font-light text-white tracking-tight">
                  ${totalPrice}
                </p>
                <p className="text-[12px] text-white/40 mb-4">
                  {weeklyCount > 0 && `${weeklyCount} week${weeklyCount !== 1 ? "s" : ""} × $${WEEKLY_PRICE}`}
                  {weeklyCount > 0 && dropinCount > 0 && " + "}
                  {dropinCount > 0 && `${dropinCount} day${dropinCount !== 1 ? "s" : ""} × $${DROPIN_PRICE}`}
                  {totalDays === 0 && "Select days above"}
                </p>
                <button
                  type="submit"
                  disabled={sending || totalDays === 0}
                  className="w-full py-3.5 bg-[#2d5016] text-white rounded-xl text-[14px] font-semibold hover:bg-[#3a6a1e] transition-colors disabled:opacity-40 active:scale-[0.99]"
                >
                  {sending ? "Registering..." : "Register Now"}
                </button>
              </div>

              <p className="text-[11px] text-[#a39e95] text-center">
                Payment details will be shared after registration.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white border-t border-[#e8e5df]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <h2 className="text-[10px] tracking-[0.15em] uppercase text-[#7a756d] font-medium mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="max-w-lg mx-auto space-y-0 divide-y divide-[#e8e5df]">
            {[
              {
                q: "Does my child need any experience?",
                a: "Not at all! The clinic is designed for all skill levels. We group players by age and ability so everyone gets the right level of instruction.",
              },
              {
                q: "What should they bring?",
                a: "A racquet (we have loaners if needed), water bottle, sneakers, and sunscreen. Athletic clothing recommended.",
              },
              {
                q: "How does pricing work?",
                a: `Select all 3 days in a week (Sun, Wed, Fri) and you get the weekly rate of $${WEEKLY_PRICE}. If you only want certain days, each individual session is $${DROPIN_PRICE}. You can mix and match — some full weeks and some individual days.`,
              },
              {
                q: "What happens if it rains?",
                a: "Sessions will be rescheduled or moved to a covered facility. We'll notify parents by email and text.",
              },
              {
                q: "What ages are accepted?",
                a: "The clinic is for ages 6–16. The younger group (ages 6–11) runs from 11:00 AM – 12:00 PM, and the middle/high school group (ages 12–16) runs from 12:00 – 1:00 PM.",
              },
            ].map((item, i) => (
              <FAQItem key={i} question={item.q} answer={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e8e5df]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <div className="text-center space-y-2">
            <p className="text-[10px] tracking-[0.15em] uppercase text-[#b0a99f]">
              DiFazio Tennis · Rhinebeck, NY
            </p>
            <p className="text-[11px] text-[#b0a99f]">
              <a
                href="mailto:difaziotennis@gmail.com"
                className="hover:text-[#1a1a1a] transition-colors"
              >
                difaziotennis@gmail.com
              </a>
              {" · "}
              <a
                href="tel:6319015220"
                className="hover:text-[#1a1a1a] transition-colors"
              >
                631-901-5220
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="py-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left"
      >
        <span className="text-[14px] font-medium text-[#1a1a1a] pr-4">
          {question}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-[#a39e95] flex-shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <p className="text-[13px] text-[#7a756d] mt-2 leading-relaxed">
          {answer}
        </p>
      )}
    </div>
  );
}
