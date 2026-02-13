import AsyncStorage from "@react-native-async-storage/async-storage";
import { User, Session, Earnings, Payout, DataPackage } from "../types";

const KEYS = {
  USER: "@clover_user",
  SESSIONS: "@clover_sessions",
  CURRENT_SESSION: "@clover_current_session",
  PAYOUTS: "@clover_payouts",
  DATA_PACKAGES: "@clover_data_packages",
};

// Estimated rate — clearly communicated as an estimate
const EST_RATE_PER_MINUTE = 0.28; // ~$16.80/hour estimated
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
    payoutMethod: "none",
  };
  await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
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
  await AsyncStorage.multiRemove([
    KEYS.USER,
    KEYS.SESSIONS,
    KEYS.CURRENT_SESSION,
    KEYS.PAYOUTS,
    KEYS.DATA_PACKAGES,
  ]);
}

// ─── Sessions ───────────────────────────────────────

async function seedDemoSessions(): Promise<void> {
  const sessions: Session[] = [];
  const now = Date.now();

  for (let i = 0; i < 8; i++) {
    const durationMinutes = Math.floor(Math.random() * 90) + 15;
    const estimatedEarnings = +(durationMinutes * EST_RATE_PER_MINUTE).toFixed(2);
    const startTime = new Date(
      now - (i + 1) * 86400000 - Math.random() * 43200000
    ).toISOString();

    // Older sessions simulate being sold, newer ones are pending
    const isSold = i >= 3; // first 3 (newest) pending, rest sold
    const actualPrice = isSold
      ? +(estimatedEarnings * (0.8 + Math.random() * 0.4)).toFixed(2) // actual varies from estimate
      : 0;

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
      estimatedEarnings,
      actualEarnings: actualPrice,
      userPayout: isSold ? +(actualPrice * USER_SPLIT).toFixed(2) : 0,
      platformRevenue: isSold ? +(actualPrice * PLATFORM_SPLIT).toFixed(2) : 0,
      dataSaleStatus: isSold
        ? i >= 5
          ? "paid_out"
          : "sold"
        : "uploaded",
      uploadedToCloud: true,
      cloudStorageKey: `recordings/${generateId()}.mp4`,
      status: "completed",
    });
  }

  await AsyncStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions));

  // Seed a demo payout for the oldest paid-out sessions
  const paidSessions = sessions.filter((s) => s.dataSaleStatus === "paid_out");
  if (paidSessions.length > 0) {
    const payoutAmount = paidSessions.reduce((s, p) => s + p.userPayout, 0);
    const payouts: Payout[] = [
      {
        id: generateId(),
        userId: "demo",
        amount: +payoutAmount.toFixed(2),
        status: "completed",
        method: "stripe",
        createdAt: new Date(now - 5 * 86400000).toISOString(),
        completedAt: new Date(now - 4.5 * 86400000).toISOString(),
      },
    ];
    await AsyncStorage.setItem(KEYS.PAYOUTS, JSON.stringify(payouts));
  }
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
    estimatedEarnings: 0,
    actualEarnings: 0,
    userPayout: 0,
    platformRevenue: 0,
    dataSaleStatus: "pending_upload",
    uploadedToCloud: false,
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
  // Only estimated earnings during recording — actual comes after data sale
  session.estimatedEarnings = +(elapsedMinutes * EST_RATE_PER_MINUTE).toFixed(2);

  await AsyncStorage.setItem(KEYS.CURRENT_SESSION, JSON.stringify(session));
  return session;
}

export async function endSession(): Promise<Session | null> {
  const stored = await AsyncStorage.getItem(KEYS.CURRENT_SESSION);
  if (!stored) return null;

  const session: Session = JSON.parse(stored);
  session.endTime = new Date().toISOString();
  session.status = "completed";
  session.dataSaleStatus = "pending_upload";

  const sessions = await getSessions();
  sessions.unshift(session);
  await AsyncStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions));
  await AsyncStorage.removeItem(KEYS.CURRENT_SESSION);

  // Queue for upload to cloud
  await dataCollectionService.queueUpload(session);

  return session;
}

// ─── Earnings ───────────────────────────────────────

export async function getEarnings(): Promise<Earnings> {
  const sessions = await getSessions();
  const payouts = await getPayouts();

  const totalEstimated = sessions.reduce(
    (sum, s) => sum + s.estimatedEarnings,
    0
  );
  const totalActualEarned = sessions.reduce(
    (sum, s) => sum + s.actualEarnings,
    0
  );
  const totalUserPayouts = sessions.reduce((sum, s) => sum + s.userPayout, 0);
  const totalPlatformRevenue = sessions.reduce(
    (sum, s) => sum + s.platformRevenue,
    0
  );

  const paidOut = payouts
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingPayout = +(totalUserPayouts - paidOut).toFixed(2);

  const totalDataMB = sessions.reduce((sum, s) => sum + s.dataSizeMB, 0);
  const totalMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);

  return {
    totalEstimated: +totalEstimated.toFixed(2),
    totalActualEarned: +totalActualEarned.toFixed(2),
    totalUserPayouts: +totalUserPayouts.toFixed(2),
    totalPlatformRevenue: +totalPlatformRevenue.toFixed(2),
    pendingPayout: Math.max(0, +pendingPayout.toFixed(2)),
    paidOut: +paidOut.toFixed(2),
    totalDataGB: +(totalDataMB / 1024).toFixed(2),
    totalHours: +(totalMinutes / 60).toFixed(1),
    sessions,
  };
}

// ─── Payouts ────────────────────────────────────────

export async function getPayouts(): Promise<Payout[]> {
  const stored = await AsyncStorage.getItem(KEYS.PAYOUTS);
  return stored ? JSON.parse(stored) : [];
}

export async function requestPayout(amount: number): Promise<Payout> {
  const user = await getUser();
  const payout: Payout = {
    id: generateId(),
    userId: user?.id || "unknown",
    amount: +amount.toFixed(2),
    status: "pending",
    method: (user?.payoutMethod as "stripe" | "bank") || "stripe",
    createdAt: new Date().toISOString(),
  };

  const payouts = await getPayouts();
  payouts.unshift(payout);
  await AsyncStorage.setItem(KEYS.PAYOUTS, JSON.stringify(payouts));

  return payout;
}

// ─── Payment Service (Stripe Connect ready) ─────────

export const paymentService = {
  /**
   * Initialize Stripe Connect onboarding for a user.
   * In production: calls your backend which creates a Stripe Connect account
   * and returns an onboarding URL.
   */
  async createConnectAccount(userId: string): Promise<{ onboardingUrl: string }> {
    // TODO: Replace with real API call to your backend:
    // POST /api/payments/connect-account { userId }
    // Backend creates Stripe Connect account via:
    //   stripe.accounts.create({ type: 'express', ... })
    //   stripe.accountLinks.create({ account, type: 'account_onboarding', ... })
    console.log(`[PaymentService] Creating Stripe Connect account for ${userId}`);
    const mockAccountId = `acct_${generateId()}`;
    await updateUser({ stripeConnectId: mockAccountId, payoutMethod: "stripe" });
    return {
      onboardingUrl: `https://connect.stripe.com/setup/mock/${mockAccountId}`,
    };
  },

  /**
   * Process a payout to a user's connected Stripe account.
   * In production: calls your backend which creates a Stripe Transfer.
   */
  async processPayout(
    payoutId: string,
    amount: number,
    stripeConnectId: string
  ): Promise<{ success: boolean; transferId: string }> {
    // TODO: Replace with real API call to your backend:
    // POST /api/payments/payout { payoutId, amount, stripeConnectId }
    // Backend creates transfer via:
    //   stripe.transfers.create({ amount, currency: 'usd', destination: stripeConnectId })
    console.log(
      `[PaymentService] Payout $${amount} to ${stripeConnectId} for payout ${payoutId}`
    );
    return {
      success: true,
      transferId: `tr_${generateId()}`,
    };
  },

  /**
   * Check payout status
   */
  async getPayoutStatus(
    payoutId: string
  ): Promise<{ status: string; amount: number }> {
    const payouts = await getPayouts();
    const payout = payouts.find((p) => p.id === payoutId);
    return {
      status: payout?.status || "unknown",
      amount: payout?.amount || 0,
    };
  },
};

// ─── Data Collection Service (Azure Blob Storage ready) ─────

export const dataCollectionService = {
  /**
   * Azure Blob Storage configuration.
   * Set these when your Azure account is ready.
   */
  config: {
    // TODO: Set these from environment variables or secure config
    azureStorageAccount: "",
    azureContainerName: "clover-recordings",
    azureSasToken: "", // Shared Access Signature token
    apiEndpoint: "", // Your backend API for data management
  },

  /**
   * Queue a completed session for upload to Azure Blob Storage.
   * In production: uploads the actual video/audio data.
   */
  async queueUpload(session: Session): Promise<void> {
    // Generate the cloud storage key
    const date = new Date().toISOString().split("T")[0];
    const key = `recordings/${date}/${session.id}/${session.type
      .toLowerCase()
      .replace(/\s+/g, "-")}.mp4`;

    console.log(`[DataCollection] Queued upload: ${key} (${session.dataSizeMB} MB)`);

    // Update session with cloud key
    const sessions = await getSessions();
    const idx = sessions.findIndex((s) => s.id === session.id);
    if (idx >= 0) {
      sessions[idx].cloudStorageKey = key;
      sessions[idx].dataSaleStatus = "uploaded";
      sessions[idx].uploadedToCloud = true;
      await AsyncStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions));
    }

    // TODO: Replace with real upload when Azure is configured:
    // const blobUrl = `https://${this.config.azureStorageAccount}.blob.core.windows.net/${this.config.azureContainerName}/${key}`;
    // await fetch(blobUrl + '?' + this.config.azureSasToken, {
    //   method: 'PUT',
    //   headers: { 'x-ms-blob-type': 'BlockBlob', 'Content-Type': 'video/mp4' },
    //   body: videoBlob,
    // });
  },

  /**
   * Get all user data for admin collection/export.
   * Returns everything needed to package and sell data.
   */
  async getAllUserData(): Promise<{
    user: User | null;
    sessions: Session[];
    totalDataMB: number;
    totalHours: number;
    cloudStorageKeys: string[];
    uploadedCount: number;
    pendingCount: number;
  }> {
    const user = await getUser();
    const sessions = await getSessions();
    const totalDataMB = sessions.reduce((sum, s) => sum + s.dataSizeMB, 0);
    const totalMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    const cloudStorageKeys = sessions
      .filter((s) => s.cloudStorageKey)
      .map((s) => s.cloudStorageKey!);

    return {
      user,
      sessions,
      totalDataMB: +totalDataMB.toFixed(1),
      totalHours: +(totalMinutes / 60).toFixed(1),
      cloudStorageKeys,
      uploadedCount: sessions.filter((s) => s.uploadedToCloud).length,
      pendingCount: sessions.filter((s) => !s.uploadedToCloud).length,
    };
  },

  /**
   * Export all data as a JSON manifest (for admin use).
   * This is what you'd send to your backend for packaging.
   */
  async exportDataManifest(): Promise<string> {
    const data = await this.getAllUserData();
    const manifest = {
      exportedAt: new Date().toISOString(),
      user: data.user
        ? {
            id: data.user.id,
            name: data.user.name,
            createdAt: data.user.createdAt,
          }
        : null,
      summary: {
        totalSessions: data.sessions.length,
        totalDataMB: data.totalDataMB,
        totalHours: data.totalHours,
        uploadedToCloud: data.uploadedCount,
        pendingUpload: data.pendingCount,
      },
      sessions: data.sessions.map((s) => ({
        id: s.id,
        type: s.type,
        startTime: s.startTime,
        endTime: s.endTime,
        durationMinutes: s.durationMinutes,
        dataSizeMB: s.dataSizeMB,
        narrationEnabled: s.narrationEnabled,
        cloudStorageKey: s.cloudStorageKey,
        dataSaleStatus: s.dataSaleStatus,
      })),
      cloudStorageKeys: data.cloudStorageKeys,
    };
    return JSON.stringify(manifest, null, 2);
  },

  /**
   * Mark sessions as sold and calculate actual earnings.
   * Called when data is sold to a buyer.
   */
  async markDataSold(
    sessionIds: string[],
    totalSalePrice: number
  ): Promise<void> {
    const sessions = await getSessions();
    const targetSessions = sessions.filter((s) => sessionIds.includes(s.id));
    const totalMinutes = targetSessions.reduce(
      (sum, s) => sum + s.durationMinutes,
      0
    );

    // Distribute sale price proportionally by duration
    for (const session of sessions) {
      if (sessionIds.includes(session.id)) {
        const proportion = session.durationMinutes / totalMinutes;
        const sessionPrice = +(totalSalePrice * proportion).toFixed(2);
        session.actualEarnings = sessionPrice;
        session.userPayout = +(sessionPrice * USER_SPLIT).toFixed(2);
        session.platformRevenue = +(sessionPrice * PLATFORM_SPLIT).toFixed(2);
        session.dataSaleStatus = "sold";
      }
    }

    await AsyncStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions));
  },
};
