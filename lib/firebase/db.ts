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
import { Booking, TimeSlot, Club, Player } from "@/lib/types";

// Collections
const BOOKINGS_COLLECTION = "bookings";
const TIME_SLOTS_COLLECTION = "timeSlots";
const USERS_COLLECTION = "users";
const CLUBS_COLLECTION = "clubs";
const PLAYERS_COLLECTION = "players";

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

// ============ CLUBS ============

export async function createClub(clubData: Omit<Club, "id">, clubId?: string): Promise<string> {
  try {
    let clubRef: any;
    if (clubId) {
      // Use the provided clubId as the document ID
      clubRef = doc(db, CLUBS_COLLECTION, clubId);
    } else {
      // Generate a new document ID
      clubRef = doc(collection(db, CLUBS_COLLECTION));
    }
    const finalClubId = clubRef.id;
    await setDoc(clubRef, {
      ...clubData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return finalClubId;
  } catch (error) {
    console.error("Error creating club:", error);
    throw error;
  }
}

export async function getClub(clubId: string): Promise<Club | null> {
  try {
    const clubRef = doc(db, CLUBS_COLLECTION, clubId);
    const clubSnap = await getDoc(clubRef);
    
    if (clubSnap.exists()) {
      return { ...clubSnap.data(), id: clubSnap.id } as Club;
    }
    return null;
  } catch (error) {
    console.error("Error getting club:", error);
    throw error;
  }
}

export async function getClubByAdminId(adminId: string): Promise<Club | null> {
  try {
    const clubsRef = collection(db, CLUBS_COLLECTION);
    const q = query(clubsRef, where("adminId", "==", adminId));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { ...doc.data(), id: doc.id } as Club;
    }
    return null;
  } catch (error) {
    console.error("Error getting club by admin ID:", error);
    throw error;
  }
}

export async function updateClub(clubId: string, updates: Partial<Omit<Club, "id">>): Promise<void> {
  try {
    const clubRef = doc(db, CLUBS_COLLECTION, clubId);
    await updateDoc(clubRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating club:", error);
    throw error;
  }
}

export async function getAllClubs(): Promise<Club[]> {
  try {
    const clubsRef = collection(db, CLUBS_COLLECTION);
    const snapshot = await getDocs(clubsRef);
    
    return snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    })) as Club[];
  } catch (error) {
    console.error("Error getting all clubs:", error);
    throw error;
  }
}

// ============ PLAYERS ============

export async function createPlayer(playerData: Omit<Player, "id">): Promise<string> {
  try {
    const playerRef = doc(collection(db, PLAYERS_COLLECTION));
    const playerId = playerRef.id;
    await setDoc(playerRef, {
      ...playerData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return playerId;
  } catch (error) {
    console.error("Error creating player:", error);
    throw error;
  }
}

export async function getPlayer(playerId: string): Promise<Player | null> {
  try {
    const playerRef = doc(db, PLAYERS_COLLECTION, playerId);
    const playerSnap = await getDoc(playerRef);
    
    if (playerSnap.exists()) {
      const data = playerSnap.data();
      return {
        ...data,
        id: playerSnap.id,
      } as Player;
    }
    return null;
  } catch (error) {
    console.error("Error getting player:", error);
    throw error;
  }
}

export async function getPlayersByClubId(clubId: string): Promise<Player[]> {
  try {
    const playersRef = collection(db, PLAYERS_COLLECTION);
    const q = query(playersRef, where("clubId", "==", clubId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    })) as Player[];
  } catch (error) {
    console.error("Error getting players by club ID:", error);
    throw error;
  }
}

export async function updatePlayer(playerId: string, updates: Partial<Omit<Player, "id" | "clubId">>): Promise<void> {
  try {
    const playerRef = doc(db, PLAYERS_COLLECTION, playerId);
    await updateDoc(playerRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating player:", error);
    throw error;
  }
}

export async function deletePlayer(playerId: string): Promise<void> {
  try {
    const playerRef = doc(db, PLAYERS_COLLECTION, playerId);
    await deleteDoc(playerRef);
  } catch (error) {
    console.error("Error deleting player:", error);
    throw error;
  }
}









