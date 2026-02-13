import AsyncStorage from "@react-native-async-storage/async-storage";
import { User, Session, Earnings, Payout } from "../types";

// ─── Configuration ─────────────────────────────────
// Change this to your deployed backend URL when ready
// Uses localhost:4000 by default. Update for production.
const API_BASE = "http://localhost:4000/api";

const TOKEN_KEY = "@clover_jwt";
const CURRENT_SESSION_KEY = "@clover_current_session_id";

// ─── HTTP helpers ──────────────────────────────────

async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

async function setToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

async function clearToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || "API request failed");
  }
  return json.data;
}

// ─── Rate helpers (kept client-side for instant UI updates) ─────

const EST_RATE_NARRATED = 0.28;
const EST_RATE_SILENT = 0.12;
const NARRATED_USER_SPLIT = 0.6;
const SILENT_USER_SPLIT = 0.4;
const MB_PER_MINUTE = 45;

export function getSessionRates(narrated: boolean) {
  return {
    estRate: narrated ? EST_RATE_NARRATED : EST_RATE_SILENT,
    userSplit: narrated ? NARRATED_USER_SPLIT : SILENT_USER_SPLIT,
    platformSplit: narrated ? (1 - NARRATED_USER_SPLIT) : (1 - SILENT_USER_SPLIT),
  };
}

// ─── Auth ──────────────────────────────────────────

export async function login(email: string, _password: string): Promise<User | null> {
  try {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password: _password }),
    });
    await setToken(data.token);
    return data.user as User;
  } catch {
    return null;
  }
}

export async function signup(email: string, _password: string, name: string): Promise<User> {
  const data = await apiFetch("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password: _password, name }),
  });
  await setToken(data.token);
  return data.user as User;
}

export async function getUser(): Promise<User | null> {
  try {
    const token = await getToken();
    if (!token) return null;
    return await apiFetch("/user/profile") as User;
  } catch {
    return null;
  }
}

export async function updateUser(updates: Partial<User>): Promise<User> {
  return await apiFetch("/user/profile", {
    method: "PUT",
    body: JSON.stringify(updates),
  }) as User;
}

export async function logout(): Promise<void> {
  await clearToken();
  await AsyncStorage.removeItem(CURRENT_SESSION_KEY);
}

// ─── Sessions ──────────────────────────────────────

export async function getSessions(): Promise<Session[]> {
  try {
    return await apiFetch("/user/sessions") as Session[];
  } catch {
    return [];
  }
}

export async function startSession(type: string, narrationEnabled: boolean): Promise<Session> {
  const session = await apiFetch("/user/sessions/start", {
    method: "POST",
    body: JSON.stringify({ type, narrationEnabled }),
  }) as Session;
  // Store session ID locally for quick access during recording
  await AsyncStorage.setItem(CURRENT_SESSION_KEY, session.id);
  return session;
}

export async function getCurrentSession(): Promise<Session | null> {
  try {
    const sessionId = await AsyncStorage.getItem(CURRENT_SESSION_KEY);
    if (!sessionId) return null;
    const sessions = await apiFetch("/user/sessions") as Session[];
    const current = sessions.find((s) => s.id === sessionId && s.status === "recording");
    return current || null;
  } catch {
    return null;
  }
}

export async function updateCurrentSession(elapsedMinutes: number): Promise<Session | null> {
  try {
    const sessionId = await AsyncStorage.getItem(CURRENT_SESSION_KEY);
    if (!sessionId) return null;
    return await apiFetch(`/user/sessions/${sessionId}`, {
      method: "PUT",
      body: JSON.stringify({ durationMinutes: elapsedMinutes }),
    }) as Session;
  } catch {
    return null;
  }
}

export async function endSession(): Promise<Session | null> {
  try {
    const sessionId = await AsyncStorage.getItem(CURRENT_SESSION_KEY);
    if (!sessionId) return null;
    const session = await apiFetch(`/user/sessions/${sessionId}/end`, {
      method: "POST",
    }) as Session;
    await AsyncStorage.removeItem(CURRENT_SESSION_KEY);
    return session;
  } catch {
    await AsyncStorage.removeItem(CURRENT_SESSION_KEY);
    return null;
  }
}

// ─── Earnings ──────────────────────────────────────

export async function getEarnings(): Promise<Earnings> {
  return await apiFetch("/user/earnings") as Earnings;
}

// ─── Payouts ───────────────────────────────────────

export async function getPayouts(): Promise<Payout[]> {
  return await apiFetch("/user/payouts") as Payout[];
}

export async function requestPayout(amount: number): Promise<Payout> {
  return await apiFetch("/user/payouts/request", {
    method: "POST",
    body: JSON.stringify({ amount }),
  }) as Payout;
}

// ─── Payment Service ───────────────────────────────

export const paymentService = {
  async createConnectAccount(_userId: string): Promise<{ onboardingUrl: string }> {
    return await apiFetch("/user/payments/connect", { method: "POST" });
  },

  async processPayout(payoutId: string, amount: number, stripeConnectId: string) {
    // This is admin-side, but keeping the interface for compatibility
    return { success: true, transferId: `tr_mock_${Date.now()}` };
  },

  async getPayoutStatus(payoutId: string) {
    const payouts = await getPayouts();
    const payout = payouts.find((p) => p.id === payoutId);
    return { status: payout?.status || "unknown", amount: payout?.amount || 0 };
  },
};

// ─── Data Collection Service ───────────────────────

export const dataCollectionService = {
  config: {
    azureStorageAccount: "",
    azureContainerName: "clover-recordings",
    azureSasToken: "",
    apiEndpoint: API_BASE,
  },

  async queueUpload(_session: Session): Promise<void> {
    // Handled server-side when session ends
  },

  async getAllUserData() {
    const user = await getUser();
    const sessions = await getSessions();
    const totalDataMB = sessions.reduce((s, x) => s + x.dataSizeMB, 0);
    const totalMinutes = sessions.reduce((s, x) => s + x.durationMinutes, 0);
    return {
      user,
      sessions,
      totalDataMB: +totalDataMB.toFixed(1),
      totalHours: +(totalMinutes / 60).toFixed(1),
      cloudStorageKeys: sessions.filter((s) => s.cloudStorageKey).map((s) => s.cloudStorageKey!),
      uploadedCount: sessions.filter((s) => s.uploadedToCloud).length,
      pendingCount: sessions.filter((s) => !s.uploadedToCloud).length,
    };
  },

  async exportDataManifest() {
    const data = await this.getAllUserData();
    return JSON.stringify(data, null, 2);
  },

  async markDataSold(_sessionIds: string[], _totalSalePrice: number) {
    // Admin-side operation, handled via admin API
  },
};
