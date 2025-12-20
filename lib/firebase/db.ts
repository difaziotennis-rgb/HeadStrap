"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "./config";
import { Booking, TimeSlot } from "@/lib/types";

// Collections
const BOOKINGS_COLLECTION = "bookings";
const TIME_SLOTS_COLLECTION = "timeSlots";
const USERS_COLLECTION = "users";

// ============ BOOKINGS ============

export async function createBooking(booking: Booking): Promise<void> {
  try {
    const bookingRef = doc(db, BOOKINGS_COLLECTION, booking.id);
    await setDoc(bookingRef, {
      ...booking,
      createdAt: Timestamp.fromDate(new Date(booking.createdAt)),
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    throw error;
  }
}

export async function getBooking(bookingId: string): Promise<Booking | null> {
  try {
    const bookingRef = doc(db, BOOKINGS_COLLECTION, bookingId);
    const bookingSnap = await getDoc(bookingRef);
    
    if (bookingSnap.exists()) {
      const data = bookingSnap.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
      } as Booking;
    }
    return null;
  } catch (error) {
    console.error("Error getting booking:", error);
    throw error;
  }
}

export async function getAllBookings(): Promise<Booking[]> {
  try {
    const bookingsRef = collection(db, BOOKINGS_COLLECTION);
    const snapshot = await getDocs(bookingsRef);
    
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
      } as Booking;
    });
  } catch (error) {
    console.error("Error getting all bookings:", error);
    throw error;
  }
}

export async function getBookingsByDate(date: string): Promise<Booking[]> {
  try {
    const bookingsRef = collection(db, BOOKINGS_COLLECTION);
    const q = query(bookingsRef, where("date", "==", date));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
      } as Booking;
    });
  } catch (error) {
    console.error("Error getting bookings by date:", error);
    throw error;
  }
}

// ============ TIME SLOTS ============

export async function createTimeSlot(slot: TimeSlot): Promise<void> {
  try {
    const slotRef = doc(db, TIME_SLOTS_COLLECTION, slot.id);
    await setDoc(slotRef, slot);
  } catch (error) {
    console.error("Error creating time slot:", error);
    throw error;
  }
}

export async function updateTimeSlot(slotId: string, updates: Partial<TimeSlot>): Promise<void> {
  try {
    const slotRef = doc(db, TIME_SLOTS_COLLECTION, slotId);
    await updateDoc(slotRef, updates as any);
  } catch (error) {
    console.error("Error updating time slot:", error);
    throw error;
  }
}

export async function getTimeSlot(slotId: string): Promise<TimeSlot | null> {
  try {
    const slotRef = doc(db, TIME_SLOTS_COLLECTION, slotId);
    const slotSnap = await getDoc(slotRef);
    
    if (slotSnap.exists()) {
      return { ...slotSnap.data(), id: slotSnap.id } as TimeSlot;
    }
    return null;
  } catch (error) {
    console.error("Error getting time slot:", error);
    throw error;
  }
}

export async function getTimeSlotsByDate(date: string): Promise<TimeSlot[]> {
  try {
    const slotsRef = collection(db, TIME_SLOTS_COLLECTION);
    const q = query(slotsRef, where("date", "==", date));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    })) as TimeSlot[];
  } catch (error) {
    console.error("Error getting time slots by date:", error);
    throw error;
  }
}

export async function getAllTimeSlots(): Promise<TimeSlot[]> {
  try {
    const slotsRef = collection(db, TIME_SLOTS_COLLECTION);
    const snapshot = await getDocs(slotsRef);
    
    return snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    })) as TimeSlot[];
  } catch (error) {
    console.error("Error getting all time slots:", error);
    throw error;
  }
}

// ============ USERS ============

export async function createUser(userId: string, userData: {
  email: string;
  name?: string;
  isAdmin?: boolean;
}): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await setDoc(userRef, {
      ...userData,
      createdAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

export async function getUser(userId: string): Promise<any> {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return { ...userSnap.data(), id: userSnap.id };
    }
    return null;
  } catch (error) {
    console.error("Error getting user:", error);
    throw error;
  }
}

export async function updateUser(userId: string, updates: any): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, updates);
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
}


