"use client";

import { useState } from "react";
import { Sun, Calendar, Clock, MapPin, Users, ChevronDown, CheckCircle, Mail, Phone, User } from "lucide-react";

export default function JuniorsPage() {
  const [formData, setFormData] = useState({
    childName: "",
    childAge: "",
    parentName: "",
    parentEmail: "",
    parentPhone: "",
    experience: "",
    notes: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      const res = await fetch("/api/junior-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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
            A fun, skills-based tennis program for young players of all levels.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-[13px] text-white/50">
            <span className="flex items-center gap-1.5">
              <Sun className="h-4 w-4 text-[#8a8477]" />
              Summer 2026
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-[#8a8477]" />
              Mon / Wed / Fri
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-[#8a8477]" />
              10:00 AM – 12:30 PM
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
              Monday, Wednesday, Friday
            </p>
            <p className="text-[14px] text-[#7a756d]">10:00 AM – 12:30 PM</p>
            <p className="text-[13px] text-[#a39e95] mt-3">
              Sessions run throughout the summer. Drop in for individual days or register for the full program.
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
              Ages 6–16
            </p>
            <p className="text-[14px] text-[#7a756d]">All skill levels welcome</p>
            <p className="text-[13px] text-[#a39e95] mt-3">
              Beginners through advanced players. Groups are organized by age and ability.
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
                  Rhinebeck native with years of experience coaching all ages. Went undefeated in match play at FDR High School, played at Brown University.
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
              <div
                key={i}
                className="flex gap-4 items-start"
              >
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
            Sign up below and we'll be in touch with everything you need to know.
          </p>

          {submitted ? (
            <div className="bg-white rounded-2xl border border-[#e8e5df] p-8 text-center">
              <CheckCircle className="h-12 w-12 text-[#2d5016] mx-auto mb-4" />
              <h3 className="text-[18px] font-medium text-[#1a1a1a] mb-2">
                You're registered!
              </h3>
              <p className="text-[13px] text-[#7a756d]">
                Thanks for signing up{formData.childName ? ` ${formData.childName}` : ""}! We'll send a confirmation email to{" "}
                <strong>{formData.parentEmail}</strong> with all the details.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  <div>
                    <label className="block text-[11px] text-[#7a756d] mb-1">
                      Experience
                    </label>
                    <select
                      value={formData.experience}
                      onChange={(e) =>
                        setFormData({ ...formData, experience: e.target.value })
                      }
                      className="w-full px-3 py-2.5 bg-[#faf9f7] border border-[#e8e5df] rounded-lg text-[16px] sm:text-[14px] text-[#1a1a1a] focus:ring-1 focus:ring-[#2d5016] focus:border-[#2d5016] outline-none transition-all appearance-none"
                    >
                      <option value="">Select</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
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

              <button
                type="submit"
                disabled={sending}
                className="w-full py-3.5 bg-[#2d5016] text-white rounded-xl text-[14px] font-semibold hover:bg-[#3a6a1e] transition-colors disabled:opacity-50 active:scale-[0.99]"
              >
                {sending ? "Registering..." : "Register for Summer Clinic"}
              </button>

              <p className="text-[11px] text-[#a39e95] text-center">
                Registration is free. Payment details will be shared after sign-up.
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
                q: "Can my child attend just some of the days?",
                a: "Yes — drop-in days are available. Full-program registration gets priority and the best rate.",
              },
              {
                q: "What happens if it rains?",
                a: "Sessions will be rescheduled or moved to a covered facility. We'll notify parents by email and text.",
              },
              {
                q: "What ages are accepted?",
                a: "The clinic is for ages 6–16. Players are grouped by age and skill level for the best learning experience.",
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
