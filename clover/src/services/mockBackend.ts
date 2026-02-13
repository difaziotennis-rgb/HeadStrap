import AsyncStorage from "@react-native-async-storage/async-storage";
import { User, Session, Earnings } from "../types";

const KEYS = {
  USER: "@clover_user",
  SESSIONS: "@clover_sessions",
  CURRENT_SESSION: "@clover_current_session",
};

const RATE_PER_MINUTE = 0.28; // ~$16.80/hour
const USER_SPLIT = 0.6;
const PLATFORM_SPLIT = 0.4;
const MB_PER_MINUTE = 45; // simulated data rate

// Job types for random session generation
const JOB_TYPES = [
  "Plumbing Repair",
  "Electrical Wiring",
  "HVAC Maintenance",
  "Carpentry",
  "Painting",
  "Landscaping",
  "Roofing Inspection",
  "Tile Installation",
  "Drywall Repair",
  "Window Installation",
  "Flooring",
  "Appliance Repair",
];

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function getRandomJobType(): string {
  return JOB_TYPES[Math.floor(Math.random() * JOB_TYPES.length)];
}

// ─── Auth ───────────────────────────────────────────

export async function login(
  email: string,
  _password: string
): Promise<User | null> {
  const stored = await AsyncStorage.getItem(KEYS.USER);
  if (stored) {
    const user: User = JSON.parse(stored);
    if (user.email === email) return user;
  }
  return null;
}

export async function signup(
  email: string,
  _password: string,
  name: string
): Promise<User> {
  const user: User = {
    id: generateId(),
    email,
    name,
    verified: false,
    calibrated: false,
    createdAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
  // Seed some demo history
  await seedDemoSessions();
  return user;
}

export async function getUser(): Promise<User | null> {
  const stored = await AsyncStorage.getItem(KEYS.USER);
  return stored ? JSON.parse(stored) : null;
}

export async function updateUser(updates: Partial<User>): Promise<User> {
  const stored = await AsyncStorage.getItem(KEYS.USER);
  const user: User = stored ? JSON.parse(stored) : {};
  const updated = { ...user, ...updates };
  await AsyncStorage.setItem(KEYS.USER, JSON.stringify(updated));
  return updated;
}

export async function logout(): Promise<void> {
  await AsyncStorage.multiRemove([KEYS.USER, KEYS.SESSIONS, KEYS.CURRENT_SESSION]);
}

// ─── Sessions ───────────────────────────────────────

async function seedDemoSessions(): Promise<void> {
  const sessions: Session[] = [];
  const now = Date.now();

  for (let i = 0; i < 8; i++) {
    const durationMinutes = Math.floor(Math.random() * 90) + 15;
    const totalEarned = +(durationMinutes * RATE_PER_MINUTE).toFixed(2);
    const startTime = new Date(
      now - (i + 1) * 86400000 - Math.random() * 43200000
    ).toISOString();

    sessions.push({
      id: generateId(),
      type: getRandomJobType(),
      startTime,
      endTime: new Date(
        new Date(startTime).getTime() + durationMinutes * 60000
      ).toISOString(),
      durationMinutes,
      dataSizeMB: +(durationMinutes * MB_PER_MINUTE).toFixed(1),
      narrationEnabled: Math.random() > 0.3,
      totalEarned,
      userShare: +(totalEarned * USER_SPLIT).toFixed(2),
      platformShare: +(totalEarned * PLATFORM_SPLIT).toFixed(2),
      status: "completed",
    });
  }

  await AsyncStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions));
}

export async function getSessions(): Promise<Session[]> {
  const stored = await AsyncStorage.getItem(KEYS.SESSIONS);
  return stored ? JSON.parse(stored) : [];
}

export async function startSession(
  type: string,
  narrationEnabled: boolean
): Promise<Session> {
  const session: Session = {
    id: generateId(),
    type,
    startTime: new Date().toISOString(),
    durationMinutes: 0,
    dataSizeMB: 0,
    narrationEnabled,
    totalEarned: 0,
    userShare: 0,
    platformShare: 0,
    status: "recording",
  };
  await AsyncStorage.setItem(KEYS.CURRENT_SESSION, JSON.stringify(session));
  return session;
}

export async function getCurrentSession(): Promise<Session | null> {
  const stored = await AsyncStorage.getItem(KEYS.CURRENT_SESSION);
  return stored ? JSON.parse(stored) : null;
}

export async function updateCurrentSession(
  elapsedMinutes: number
): Promise<Session | null> {
  const stored = await AsyncStorage.getItem(KEYS.CURRENT_SESSION);
  if (!stored) return null;

  const session: Session = JSON.parse(stored);
  session.durationMinutes = +elapsedMinutes.toFixed(2);
  session.dataSizeMB = +(elapsedMinutes * MB_PER_MINUTE).toFixed(1);
  session.totalEarned = +(elapsedMinutes * RATE_PER_MINUTE).toFixed(2);
  session.userShare = +(session.totalEarned * USER_SPLIT).toFixed(2);
  session.platformShare = +(session.totalEarned * PLATFORM_SPLIT).toFixed(2);

  await AsyncStorage.setItem(KEYS.CURRENT_SESSION, JSON.stringify(session));
  return session;
}

export async function endSession(): Promise<Session | null> {
  const stored = await AsyncStorage.getItem(KEYS.CURRENT_SESSION);
  if (!stored) return null;

  const session: Session = JSON.parse(stored);
  session.endTime = new Date().toISOString();
  session.status = "completed";

  // Add to session history
  const sessions = await getSessions();
  sessions.unshift(session);
  await AsyncStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions));
  await AsyncStorage.removeItem(KEYS.CURRENT_SESSION);

  return session;
}

// ─── Earnings ───────────────────────────────────────

export async function getEarnings(): Promise<Earnings> {
  const sessions = await getSessions();

  const totalEarned = sessions.reduce((sum, s) => sum + s.totalEarned, 0);
  const totalUserShare = sessions.reduce((sum, s) => sum + s.userShare, 0);
  const totalPlatformShare = sessions.reduce(
    (sum, s) => sum + s.platformShare,
    0
  );
  const totalDataMB = sessions.reduce((sum, s) => sum + s.dataSizeMB, 0);
  const totalMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);

  return {
    totalEarned: +totalEarned.toFixed(2),
    totalUserShare: +totalUserShare.toFixed(2),
    totalPlatformShare: +totalPlatformShare.toFixed(2),
    totalDataGB: +(totalDataMB / 1024).toFixed(2),
    totalHours: +(totalMinutes / 60).toFixed(1),
    sessions,
  };
}
