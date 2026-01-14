import { cookies } from "next/headers"

export type UserRole = "admin" | "member"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  memberNumber?: string
}

export async function getSession(): Promise<User | null> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get("eliteclub_session")?.value

  if (!sessionToken) {
    return null
  }

  // In a real app, you'd verify the token and fetch user from database
  // For now, we'll use a simple approach with encrypted session data
  try {
    // Decode session (in production, use proper JWT or session store)
    const sessionData = JSON.parse(
      Buffer.from(sessionToken, "base64").toString("utf-8")
    )

    // Verify session hasn't expired
    if (sessionData.expires && new Date(sessionData.expires) < new Date()) {
      return null
    }

    return sessionData.user as User
  } catch {
    return null
  }
}

export async function createSession(user: User): Promise<void> {
  const cookieStore = await cookies()
  const expires = new Date()
  expires.setDate(expires.getDate() + 7) // 7 days

  const sessionData = {
    user,
    expires: expires.toISOString(),
  }

  const sessionToken = Buffer.from(JSON.stringify(sessionData)).toString("base64")

  cookieStore.set("eliteclub_session", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  })
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete("eliteclub_session")
}


