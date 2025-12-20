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


