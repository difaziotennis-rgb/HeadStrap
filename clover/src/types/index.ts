export interface User {
  id: string;
  email: string;
  name: string;
  verified: boolean;
  calibrated: boolean;
  createdAt: string;
  stripeConnectId?: string; // Stripe Connect account for payouts
  payoutMethod?: "stripe" | "bank" | "none";
}

export interface Session {
  id: string;
  type: string;
  startTime: string;
  endTime?: string;
  durationMinutes: number;
  dataSizeMB: number;
  narrationEnabled: boolean;
  // Estimated earnings (based on avg rates, shown in real-time)
  estimatedEarnings: number;
  // Actual earnings (set after data is sold; 0 until then)
  actualEarnings: number;
  // Revenue split only happens after data sale
  userPayout: number; // 60% of actual (0 until sold)
  platformRevenue: number; // 40% of actual (0 until sold)
  // Data sale lifecycle
  dataSaleStatus: "pending_upload" | "uploaded" | "listed" | "sold" | "paid_out";
  uploadedToCloud: boolean;
  cloudStorageKey?: string; // Azure Blob key
  status: "recording" | "paused" | "completed" | "error";
}

export interface Earnings {
  // Estimated (shown as "projected" to user)
  totalEstimated: number;
  // Actual (from sold data)
  totalActualEarned: number;
  totalUserPayouts: number;
  totalPlatformRevenue: number;
  // Payout tracking
  pendingPayout: number; // sold but not yet paid to user
  paidOut: number; // already transferred to user
  // Data stats
  totalDataGB: number;
  totalHours: number;
  sessions: Session[];
}

export interface Payout {
  id: string;
  userId: string;
  amount: number;
  status: "pending" | "processing" | "completed" | "failed";
  method: "stripe" | "bank";
  createdAt: string;
  completedAt?: string;
  stripeTransferId?: string;
}

export interface DataPackage {
  id: string;
  sessionIds: string[];
  totalSizeMB: number;
  totalDurationMinutes: number;
  category: string;
  status: "uploading" | "uploaded" | "listed" | "sold";
  cloudStorageUrl?: string;
  salePrice?: number;
  soldAt?: string;
  buyerId?: string;
}

export type StoplightStatus = "green" | "yellow" | "red";

export type RootStackParamList = {
  Login: undefined;
  HumanVerification: undefined;
  Calibration: undefined;
  MainTabs: undefined;
  Recorder: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Vault: undefined;
  Settings: undefined;
};
