export interface TimeSlot {
  id: string;
  date: string; // YYYY-MM-DD
  hour: number; // 0-23
  available: boolean;
  booked: boolean;
  bookedBy?: string;
  bookedEmail?: string;
  bookedPhone?: string;
  notes?: string;
}

export interface Booking {
  id: string;
  timeSlotId: string;
  date: string;
  hour: number;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  status: "pending" | "confirmed" | "cancelled";
  createdAt: string;
  paymentStatus?: "pending" | "paid" | "refunded";
  amount: number;
}

export interface AdminUser {
  id: string;
  email: string;
  password: string; // In production, this should be hashed
}

export interface Player {
  id: string;
  name: string;
  points: number;
  clubId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Club {
  id: string;
  name: string;
  adminId: string; // User ID of the club admin
  createdAt?: string;
  updatedAt?: string;
}

export interface RecurringLesson {
  id: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  dayOfWeek: number; // 0=Sun, 1=Mon, ... 6=Sat
  hour: number; // e.g. 10, 14, 19.5
  startDate: string; // YYYY-MM-DD — first occurrence
  endDate: string; // YYYY-MM-DD — last occurrence (default ~6 months out)
  /** Dates (YYYY-MM-DD) where this recurring lesson is cancelled for that week */
  cancelledDates: string[];
  createdAt: string;
}









