"use client";

import {
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "./config";

const googleProvider = new GoogleAuthProvider();

// Sign in with Google
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
}

// Sign out
export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error("Error signing out:", error);
    throw error;
  }
}

// Get current user
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

// Listen to auth state changes
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// Check if user is admin (you can customize this logic)
export function isAdmin(user: User | null): boolean {
  if (!user) return false;
  
  // For now, check if email matches admin email
  // You can customize this to check Firestore for admin role
  const adminEmails = [
    process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@difaziotennis.com",
  ];
  
  return adminEmails.includes(user.email || "");
}









