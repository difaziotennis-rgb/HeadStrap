export const rtcNav = [
  { href: "/RTC", label: "Overview" },
  { href: "/RTC/book", label: "Court Booking" },
  { href: "/RTC/lessons", label: "Private Lessons" },
  { href: "/RTC/clinics", label: "Clinics" },
  { href: "/RTC/events", label: "Events" },
  { href: "/RTC/member/portal", label: "Dashboard" },
];

export const rtcCoaches = [
  {
    name: "Robert Myerson",
    role: "Tennis Director",
    rate: "$165 / hour",
    bio: "A founding steward of Rhinebeck tennis and longtime club leader, Bob has spent decades building, guiding, and caring for the RTC community. His coaching blends deep experience, clear fundamentals, and the welcoming spirit that helped shape the club.",
  },
  {
    name: "Derek DiFazio",
    role: "Head Pro",
    rate: "$160 / hour",
    bio: "Certified teaching pro, active tournament competitor currently ranked #4 in New York in Men's 35's, and movement-focused coach blending technical development, match-play strategy, and junior development.",
  },
  {
    name: "Jay Behrke",
    role: "Senior Coach",
    rate: "$140 / hour",
    bio: "USPTR-certified coach with decades of experience helping players sharpen fundamentals, point construction, and confidence in competition.",
  },
  {
    name: "Jonah Berkowitz",
    role: "Performance Coach",
    rate: "$140 / hour",
    bio: "Technique-first coaching with clear cues and measurable progress for players who want clean mechanics and repeatable strokes.",
  },
];

export const rtcClinics = [
  {
    name: "Monday Nights with Derek",
    schedule: "Monday · 6:00 PM · 1 h 30 min session",
    level: "All levels",
    memberPrice: "$75",
    publicPrice: "$90",
  },
  {
    name: "Wednesday Nights with Jay",
    schedule: "Wednesday · 6:00 PM · 1 h 30 min session",
    level: "All levels",
    memberPrice: "$75",
    publicPrice: "$90",
  },
  {
    name: "Friday Nights with Derek",
    schedule: "Friday · 6:00 PM · 1 h 30 min session",
    level: "All levels",
    memberPrice: "$75",
    publicPrice: "$90",
  },
  {
    name: "Saturday Advanced",
    schedule: "Saturday · 9:00 AM · 3 hr session",
    level: "Advanced",
    memberPrice: "$75",
    publicPrice: "$90",
  },
  {
    name: "Saturday Intermediate",
    schedule: "Saturday · 9:00 AM · 3 hr session",
    level: "Intermediate",
    memberPrice: "$75",
    publicPrice: "$90",
  },
  {
    name: "Sunday Advanced Intermediate",
    schedule: "Sunday · 9:00 AM · 3 hr session",
    level: "Advanced Intermediate",
    memberPrice: "$75",
    publicPrice: "$90",
  },
  {
    name: "Sunday Advanced",
    schedule: "Sunday · 9:00 AM · 3 hr session",
    level: "Advanced",
    memberPrice: "$95",
    publicPrice: "$110",
  },
];

export const rtcClinicCourtBlocks: Record<
  string,
  { weekday: number; startHour: number; durationHours: number }
> = {
  "Monday Nights with Derek": { weekday: 1, startHour: 18, durationHours: 2 },
  "Wednesday Nights with Jay": { weekday: 3, startHour: 18, durationHours: 2 },
  "Friday Nights with Derek": { weekday: 5, startHour: 18, durationHours: 2 },
  "Saturday Advanced": { weekday: 6, startHour: 9, durationHours: 3 },
  "Saturday Intermediate": { weekday: 6, startHour: 9, durationHours: 3 },
  "Sunday Advanced Intermediate": { weekday: 0, startHour: 9, durationHours: 3 },
  "Sunday Advanced": { weekday: 0, startHour: 9, durationHours: 3 },
};

export const rtcSampleSlots = [
  { court: "Indoor Court", time: "Fri, Apr 12 · 7:00 PM" },
  { court: "Outdoor Court 2", time: "Sat, Apr 13 · 9:00 AM" },
  { court: "Outdoor Court 4", time: "Sat, Apr 13 · 10:00 AM" },
  { court: "Outdoor Court 1", time: "Sun, Apr 14 · 8:00 AM" },
];

const DEFAULT_EVENT_IMAGE =
  "https://images.unsplash.com/photo-1662663560803-db03b7821eb9?auto=format&fit=crop&w=1800&q=80";

export const rtcEventImageById: Record<string, string> = {
  "member-guest-weekend":
    "https://images.unsplash.com/flagged/photo-1576972405668-2d020a01cbfa?auto=format&fit=crop&w=1800&q=80",
  "summer-white-party":
    "https://images.unsplash.com/photo-1755238798584-782309132c90?auto=format&fit=crop&w=1800&q=80",
  "junior-family-day":
    "https://images.unsplash.com/photo-1504030688812-2c4804e8d291?auto=format&fit=crop&w=1800&q=80",
  "twilight-mixed-doubles":
    "https://images.unsplash.com/photo-1542446608-e9525230faed?auto=format&fit=crop&w=1800&q=80",
  "season-finale-garden-gala":
    "https://images.unsplash.com/photo-1768594266719-ab1569870a1f?auto=format&fit=crop&w=1800&q=80",
  "valley-rally-cup":
    "https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&w=1800&q=80",
};

export function getRTCEventImage(eventId: string): string {
  return rtcEventImageById[eventId] || DEFAULT_EVENT_IMAGE;
}

export const rtcSummerEvents = [
  {
    id: "member-guest-weekend",
    title: "Member-Guest Tennis Weekend",
    dateLabel: "July 18-20",
    timeLabel: "Fri 5:30 PM - Sun 4:00 PM",
    category: "Tournament",
    audience: "Members + Guests",
    capacity: 48,
    priceMember: "$295 / team",
    pricePublic: "By invite only",
    description:
      "Three-day club signature weekend with doubles play, evening receptions, and Sunday championship finals.",
    highlights: [
      "Friday opening night courtside reception",
      "Saturday all-day match blocks with brunch and lunch service",
      "Sunday finals and trophy social",
    ],
  },
  {
    id: "summer-white-party",
    title: "Summer White Party",
    dateLabel: "July 27",
    timeLabel: "5:00 PM - 9:30 PM",
    category: "Social",
    audience: "Members + Public",
    capacity: 80,
    priceMember: "$65",
    pricePublic: "$85",
    description:
      "An elegant summer evening of music, signature cocktails, and a chef-curated social dinner on the terrace.",
    highlights: [
      "Live DJ and sunset welcome toast",
      "Seasonal charcuterie and passed hors d'oeuvres",
      "Garden-inspired photo lounge",
    ],
  },
  {
    id: "junior-family-day",
    title: "Junior Family Tennis Day",
    dateLabel: "August 3",
    timeLabel: "10:00 AM - 2:00 PM",
    category: "Family",
    audience: "Members + Public",
    capacity: 60,
    priceMember: "$38",
    pricePublic: "$52",
    description:
      "A family-friendly club day with red/orange/green-ball play, parent-child games, and light lunch service.",
    highlights: [
      "Age-based mini sessions",
      "Parent-child challenge court",
      "Lunch and hydration station included",
    ],
  },
  {
    id: "twilight-mixed-doubles",
    title: "Twilight Mixed Doubles Mixer",
    dateLabel: "August 16",
    timeLabel: "6:00 PM - 9:00 PM",
    category: "Tennis Social",
    audience: "Members + Public",
    capacity: 56,
    priceMember: "$45",
    pricePublic: "$60",
    description:
      "Round-robin mixed doubles with curated pairings, post-play bites, and social lounge seating.",
    highlights: [
      "Curated rotating partners",
      "Structured social scoring format",
      "Clubhouse dessert and espresso service",
    ],
  },
  {
    id: "valley-rally-cup",
    title: "1st Inaugural 'Valley Rally' Cup",
    dateLabel: "Date TBA",
    timeLabel: "Start Time TBA",
    category: "Club Match",
    audience: "Rhinebeck TC + Woodstock TC",
    capacity: 60,
    priceMember: "Included for selected team players",
    pricePublic: "Spectator details TBA",
    description:
      "A head-to-head club match between Woodstock Tennis Club and Rhinebeck Tennis Club in a World TeamTennis format.",
    highlights: [
      "5 sets: Men's Singles, Women's Singles, Men's Doubles, Women's Doubles, Mixed Doubles",
      "Each set is first to 5 games with no-ad scoring",
      "All games count toward cumulative team score across the full match",
    ],
  },
  {
    id: "season-finale-garden-gala",
    title: "Season Finale Garden Gala",
    dateLabel: "September 7",
    timeLabel: "6:30 PM - 10:30 PM",
    category: "Gala",
    audience: "Members + Public",
    capacity: 120,
    priceMember: "$110",
    pricePublic: "$145",
    description:
      "A polished end-of-summer celebration featuring member awards, live music, and an elevated dinner program.",
    highlights: [
      "Member recognition and seasonal awards",
      "Live acoustic set and dance floor",
      "Three-course gala dinner",
    ],
  },
];
