export interface User {
  id: string;
  email: string;
  name: string;
  verified: boolean;
  calibrated: boolean;
  createdAt: string;
}

export interface Session {
  id: string;
  type: string;
  startTime: string;
  endTime?: string;
  durationMinutes: number;
  dataSizeMB: number;
  narrationEnabled: boolean;
  totalEarned: number;
  userShare: number;
  platformShare: number;
  status: "recording" | "paused" | "completed" | "error";
}

export interface Earnings {
  totalEarned: number;
  totalUserShare: number;
  totalPlatformShare: number;
  totalDataGB: number;
  totalHours: number;
  sessions: Session[];
}

export type StoplightStatus = "green" | "yellow" | "red";

export type RootStackParamList = {
  Login: undefined;
  HumanVerification: undefined;
  Calibration: undefined;
  MainTabs: undefined;
  Recorder: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Vault: undefined;
};
